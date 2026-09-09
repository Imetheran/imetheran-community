import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import { setCommunityEventRsvp, updateCommunityEventStatus } from "../actions";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(value));
}

function roleFromClaims(appMetadata: unknown) {
  if (!appMetadata || typeof appMetadata !== "object" || !("role" in appMetadata)) return "member";
  return String((appMetadata as { role?: unknown }).role ?? "member");
}

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ message?: string; erreur?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;
  const role = roleFromClaims(claimsData?.claims?.app_metadata);

  const { data: event, error } = await supabase
    .from("community_events")
    .select("id, creator_id, slug, title, description, event_type, location, starts_at, ends_at, capacity, visibility, status, related_chronicle_id, related_topic_id")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !event) notFound();

  const [{ data: creator }, { data: rsvps }, chronicleResult, topicResult] = await Promise.all([
    supabase.from("profiles").select("id, display_name, username").eq("id", event.creator_id).maybeSingle(),
    supabase.from("community_event_rsvps").select("user_id, response, updated_at").eq("event_id", event.id).order("updated_at", { ascending: true }),
    event.related_chronicle_id
      ? supabase.from("chronicles").select("id, slug, title").eq("id", event.related_chronicle_id).maybeSingle()
      : Promise.resolve({ data: null }),
    event.related_topic_id
      ? supabase.from("forum_topics").select("id, board_id, slug, title").eq("id", event.related_topic_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const profilesIds = Array.from(new Set((rsvps ?? []).map((rsvp) => rsvp.user_id)));
  const profileResult = profilesIds.length
    ? await supabase.from("profiles").select("id, display_name, username").in("id", profilesIds)
    : { data: [] as { id: string; display_name: string; username: string | null }[] };
  const profileMap = new Map((profileResult.data ?? []).map((profile) => [profile.id, profile]));
  const going = (rsvps ?? []).filter((rsvp) => rsvp.response === "going");
  const maybe = (rsvps ?? []).filter((rsvp) => rsvp.response === "maybe");
  const ownResponse = userId ? (rsvps ?? []).find((rsvp) => rsvp.user_id === userId)?.response ?? null : null;
  const canManage = Boolean(userId && (event.creator_id === userId || role === "admin" || role === "moderator"));
  const chronicle = chronicleResult.data;
  const topic = topicResult.data;
  const boardResult = topic
    ? await supabase.from("forum_boards").select("slug, title").eq("id", topic.board_id).maybeSingle()
    : { data: null };
  const board = boardResult.data;
  const full = Boolean(event.capacity && going.length >= event.capacity);

  const errorMessage = query.erreur === "complet"
    ? "Toutes les places sont déjà prises."
    : query.erreur === "suspendu"
      ? "Votre participation est actuellement suspendue."
      : query.erreur
        ? "L’action n’a pas pu être enregistrée."
        : null;

  return (
    <main className="site-shell event-page">
      <SiteHeader />

      <section className="event-detail-hero">
        <div className="content-frame">
          <p className="eyebrow">{event.event_type === "rp" ? "Événement RP" : "Événement HRP"}</p>
          <h1>{event.title}</h1>
          <p>{event.status === "cancelled" ? "Annulé" : event.status === "finished" ? "Terminé" : formatDate(event.starts_at)}</p>
        </div>
      </section>

      <section className="content-frame event-detail-workspace">
        {query.message ? <div className="tools-notice" role="status">Modification enregistrée.</div> : null}
        {errorMessage ? <div className="tools-notice tools-notice--error" role="alert">{errorMessage}</div> : null}

        <div className="event-detail-layout">
          <article className="event-detail-main">
            <div className="event-detail-facts">
              <div><small>Début</small><strong>{formatDate(event.starts_at)}</strong></div>
              {event.ends_at ? <div><small>Fin</small><strong>{formatDate(event.ends_at)}</strong></div> : null}
              {event.location ? <div><small>Lieu</small><strong>{event.location}</strong></div> : null}
              <div><small>Présences</small><strong>{going.length}{event.capacity ? ` / ${event.capacity}` : ""}</strong></div>
            </div>

            {event.description ? <div className="event-detail-description">{event.description}</div> : null}

            <div className="event-detail-links">
              {creator ? <Link href={creator.username ? `/membres/${creator.username}` : "/membres"}>Organisé par {creator.display_name}</Link> : null}
              {chronicle ? <Link href={`/chroniques/${chronicle.slug}`}>Chronique · {chronicle.title}</Link> : null}
              {topic && board ? <Link href={`/forum/${board.slug}/sujet/${topic.slug}`}>Forum · {topic.title}</Link> : null}
            </div>
          </article>

          <aside className="event-rsvp-panel">
            <header><h2>Participation</h2><span>{going.length} présent{going.length > 1 ? "s" : ""}</span></header>
            {event.status === "scheduled" ? userId ? (
              <form className="event-rsvp-actions" action={setCommunityEventRsvp}>
                <input type="hidden" name="event_id" value={event.id} />
                <input type="hidden" name="slug" value={event.slug} />
                <button className={ownResponse === "going" ? "is-current" : ""} name="response" value="going" type="submit" disabled={full && ownResponse !== "going"}>Présent</button>
                <button className={ownResponse === "maybe" ? "is-current" : ""} name="response" value="maybe" type="submit">Peut-être</button>
                <button className={ownResponse === "declined" ? "is-current" : ""} name="response" value="declined" type="submit">Absent</button>
                {ownResponse ? <button className="event-rsvp-clear" name="response" value="none" type="submit">Retirer ma réponse</button> : null}
              </form>
            ) : <Link className="button button--primary button--small" href={`/connexion?message=connexion-requise&retour=${encodeURIComponent(`/evenements/${event.slug}`)}`}>Se connecter</Link> : null}

            {going.length > 0 ? (
              <div className="event-attendees">
                {going.slice(0, 12).map((rsvp) => {
                  const profile = profileMap.get(rsvp.user_id);
                  return profile ? <Link href={profile.username ? `/membres/${profile.username}` : "/membres"} key={rsvp.user_id}>{profile.display_name}</Link> : null;
                })}
              </div>
            ) : null}
            {maybe.length > 0 ? <small>{maybe.length} peut-être</small> : null}
          </aside>
        </div>

        {canManage ? (
          <div className="event-manage-bar">
            <strong>Gestion</strong>
            <form action={updateCommunityEventStatus}>
              <input type="hidden" name="event_id" value={event.id} />
              <input type="hidden" name="slug" value={event.slug} />
              {event.status !== "scheduled" ? <button name="status" value="scheduled" type="submit">Rouvrir</button> : null}
              {event.status === "scheduled" ? <button name="status" value="finished" type="submit">Terminer</button> : null}
              {event.status !== "cancelled" ? <button name="status" value="cancelled" type="submit">Annuler</button> : null}
            </form>
          </div>
        ) : null}

        <Link className="text-link" href="/evenements">← Retour aux événements</Link>
      </section>
    </main>
  );
}
