import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Événements",
};

type EventRow = {
  id: string;
  creator_id: string;
  slug: string;
  title: string;
  event_type: string;
  location: string;
  starts_at: string;
  ends_at: string | null;
  capacity: number | null;
  visibility: string;
  status: string;
  related_chronicle_id: string | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(new Date(value));
}

function eventStatusLabel(status: string) {
  if (status === "cancelled") return "Annulé";
  if (status === "finished") return "Terminé";
  return null;
}

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const signedIn = typeof claimsData?.claims?.sub === "string";
  const now = new Date().toISOString();

  const [upcomingResult, recentResult] = await Promise.all([
    supabase
      .from("community_events")
      .select("id, creator_id, slug, title, event_type, location, starts_at, ends_at, capacity, visibility, status, related_chronicle_id")
      .gte("starts_at", now)
      .eq("status", "scheduled")
      .order("starts_at", { ascending: true })
      .limit(24),
    supabase
      .from("community_events")
      .select("id, creator_id, slug, title, event_type, location, starts_at, ends_at, capacity, visibility, status, related_chronicle_id")
      .or(`starts_at.lt.${now},status.neq.scheduled`)
      .order("starts_at", { ascending: false })
      .limit(12),
  ]);

  const upcoming = (upcomingResult.data ?? []) as EventRow[];
  const recent = (recentResult.data ?? []) as EventRow[];
  const events = [...upcoming, ...recent];
  const eventIds = events.map((event) => event.id);
  const creatorIds = Array.from(new Set(events.map((event) => event.creator_id));
  const chronicleIds = Array.from(new Set(events.map((event) => event.related_chronicle_id).filter((id): id is string => Boolean(id))));

  const [rsvpResult, profileResult, chronicleResult] = await Promise.all([
    eventIds.length
      ? supabase.from("community_event_rsvps").select("event_id, response").in("event_id", eventIds)
      : Promise.resolve({ data: [] as { event_id: string; response: string }[] }),
    creatorIds.length
      ? supabase.from("profiles").select("id, display_name, username").in("id", creatorIds)
      : Promise.resolve({ data: [] as { id: string; display_name: string; username: string | null }[] }),
    chronicleIds.length
      ? supabase.from("chronicles").select("id, slug, title").in("id", chronicleIds)
      : Promise.resolve({ data: [] as { id: string; slug: string; title: string }[] }),
  ]);

  const creatorMap = new Map((profileResult.data ?? []).map((profile) => [profile.id, profile]));
  const chronicleMap = new Map((chronicleResult.data ?? []).map((chronicle) => [chronicle.id, chronicle]));
  const goingCount = new Map<string, number>();
  for (const rsvp of rsvpResult.data ?? []) {
    if (rsvp.response === "going") goingCount.set(rsvp.event_id, (goingCount.get(rsvp.event_id) ?? 0) + 1);
  }

  const renderEvent = (event: EventRow) => {
    const creator = creatorMap.get(event.creator_id);
    const chronicle = event.related_chronicle_id ? chronicleMap.get(event.related_chronicle_id) : null;
    const attending = goingCount.get(event.id) ?? 0;
    const state = eventStatusLabel(event.status);
    return (
      <article className="event-card" key={event.id}>
        <div className="event-card__date"><strong>{formatDate(event.starts_at)}</strong></div>
        <div className="event-card__body">
          <div className="event-card__meta">
            <span>{event.event_type === "rp" ? "RP" : "HRP"}</span>
            {event.visibility === "members" ? <span>Membres</span> : null}
            {state ? <strong>{state}</strong> : null}
          </div>
          <h2><Link href={`/evenements/${event.slug}`}>{event.title}</Link></h2>
          <div className="event-card__details">
            {event.location ? <span>{event.location}</span> : null}
            <span>{attending}{event.capacity ? ` / ${event.capacity}` : ""} présent{attending > 1 ? "s" : ""}</span>
            {creator ? <span>par {creator.display_name}</span> : null}
          </div>
          {chronicle ? <Link className="event-card__chronicle" href={`/chroniques/${chronicle.slug}`}>Chronique · {chronicle.title}</Link> : null}
        </div>
        <Link className="text-link" href={`/evenements/${event.slug}`}>Ouvrir →</Link>
      </article>
    );
  };

  return (
    <main className="site-shell events-page">
      <SiteHeader />

      <section className="events-hero">
        <div className="content-frame">
          <p className="eyebrow">Agenda communautaire</p>
          <h1>Événements</h1>
        </div>
      </section>

      <section className="content-frame events-workspace">
        <div className="events-toolbar">
          <div><strong>{upcoming.length}</strong><span>à venir</span></div>
          <Link className="button button--primary button--small" href={signedIn ? "/evenements/nouveau" : "/connexion?message=connexion-requise&retour=%2Fevenements%2Fnouveau"}>Créer un événement</Link>
        </div>

        {upcomingResult.error ? <div className="tools-notice tools-notice--error">Les événements n’ont pas pu être chargés.</div> : null}

        {upcoming.length > 0 ? (
          <div className="event-list">{upcoming.map(renderEvent)}</div>
        ) : (
          <div className="tools-empty"><h3>Aucun événement à venir</h3><Link className="button button--ghost" href="/evenements/nouveau">Proposer une date</Link></div>
        )}

        {recent.length > 0 ? (
          <section className="events-archive">
            <header><h2>Événements récents</h2></header>
            <div className="event-list event-list--past">{recent.map(renderEvent)}</div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
