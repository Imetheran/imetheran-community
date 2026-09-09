"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMemberParticipation } from "@/lib/member-participation";
import { createClient } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const responses = new Set(["going", "maybe", "declined"]);
const statuses = new Set(["scheduled", "cancelled", "finished"]);

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "evenement";
}

function parisLocalToIso(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const guess = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    timeZoneName: "longOffset",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const zoneName = formatter.formatToParts(new Date(guess)).find((part) => part.type === "timeZoneName")?.value ?? "GMT+01:00";
  const offsetMatch = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(zoneName);
  if (!offsetMatch) return null;
  const offsetMinutes = (Number(offsetMatch[2]) * 60 + Number(offsetMatch[3] ?? 0)) * (offsetMatch[1] === "+" ? 1 : -1);
  return new Date(guess - offsetMinutes * 60_000).toISOString();
}

async function authenticatedMember(returnTo: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || typeof userId !== "string") redirect(`/connexion?message=connexion-requise&retour=${encodeURIComponent(returnTo)}`);
  const participation = await getMemberParticipation(supabase, userId);
  return { supabase, userId, participation };
}

export async function createCommunityEvent(formData: FormData) {
  const title = field(formData, "title").slice(0, 120);
  const description = field(formData, "description").slice(0, 4000);
  const eventType = field(formData, "event_type") === "hrp" ? "hrp" : "rp";
  const location = field(formData, "location").slice(0, 140);
  const visibility = field(formData, "visibility") === "members" ? "members" : "public";
  const startsAt = parisLocalToIso(field(formData, "starts_at"));
  const endsRaw = field(formData, "ends_at");
  const endsAt = endsRaw ? parisLocalToIso(endsRaw) : null;
  const capacityRaw = Number.parseInt(field(formData, "capacity"), 10);
  const capacity = Number.isFinite(capacityRaw) && capacityRaw > 0 ? Math.min(200, capacityRaw) : null;
  const chronicleIdRaw = field(formData, "related_chronicle_id");
  const topicIdRaw = field(formData, "related_topic_id");
  const relatedChronicleId = uuidPattern.test(chronicleIdRaw) ? chronicleIdRaw : null;
  const relatedTopicId = uuidPattern.test(topicIdRaw) ? topicIdRaw : null;

  if (!title || !startsAt || (endsAt && new Date(endsAt) <= new Date(startsAt))) {
    redirect("/evenements/nouveau?erreur=champs");
  }

  const { supabase, userId, participation } = await authenticatedMember("/evenements/nouveau");
  if (!participation.canParticipate) redirect("/evenements/nouveau?erreur=suspendu");

  const slug = `${slugify(title)}-${randomUUID().slice(0, 8)}`;
  const { error } = await supabase.from("community_events").insert({
    creator_id: userId,
    slug,
    title,
    description,
    event_type: eventType,
    location,
    starts_at: startsAt,
    ends_at: endsAt,
    capacity,
    visibility,
    related_chronicle_id: relatedChronicleId,
    related_topic_id: relatedTopicId,
  });

  if (error) redirect("/evenements/nouveau?erreur=publication");

  revalidatePath("/");
  revalidatePath("/evenements");
  redirect(`/evenements/${slug}`);
}

export async function setCommunityEventRsvp(formData: FormData) {
  const eventId = field(formData, "event_id");
  const slug = field(formData, "slug");
  const response = field(formData, "response");
  if (!uuidPattern.test(eventId) || !/^[a-z0-9-]+$/.test(slug)) redirect("/evenements");

  const { supabase, userId, participation } = await authenticatedMember(`/evenements/${slug}`);
  if (!participation.canParticipate) redirect(`/evenements/${slug}?erreur=suspendu`);

  if (response === "none") {
    await supabase.from("community_event_rsvps").delete().eq("event_id", eventId).eq("user_id", userId);
  } else {
    if (!responses.has(response)) redirect(`/evenements/${slug}?erreur=reponse`);

    if (response === "going") {
      const [{ data: event }, { count }] = await Promise.all([
        supabase.from("community_events").select("capacity, status").eq("id", eventId).maybeSingle(),
        supabase.from("community_event_rsvps").select("user_id", { count: "exact", head: true }).eq("event_id", eventId).eq("response", "going"),
      ]);
      if (!event || event.status !== "scheduled") redirect(`/evenements/${slug}?erreur=ferme`);
      if (event.capacity && (count ?? 0) >= event.capacity) {
        const { data: existing } = await supabase.from("community_event_rsvps").select("response").eq("event_id", eventId).eq("user_id", userId).maybeSingle();
        if (existing?.response !== "going") redirect(`/evenements/${slug}?erreur=complet`);
      }
    }

    const { error } = await supabase.from("community_event_rsvps").upsert({
      event_id: eventId,
      user_id: userId,
      response,
      updated_at: new Date().toISOString(),
    }, { onConflict: "event_id,user_id" });
    if (error) redirect(`/evenements/${slug}?erreur=reponse`);
  }

  revalidatePath(`/evenements/${slug}`);
  revalidatePath("/evenements");
  redirect(`/evenements/${slug}?message=presence`);
}

export async function updateCommunityEventStatus(formData: FormData) {
  const eventId = field(formData, "event_id");
  const slug = field(formData, "slug");
  const status = field(formData, "status");
  if (!uuidPattern.test(eventId) || !/^[a-z0-9-]+$/.test(slug) || !statuses.has(status)) redirect("/evenements");

  const { supabase } = await authenticatedMember(`/evenements/${slug}`);
  const { error } = await supabase
    .from("community_events")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", eventId);
  if (error) redirect(`/evenements/${slug}?erreur=gestion`);

  revalidatePath(`/evenements/${slug}`);
  revalidatePath("/evenements");
  redirect(`/evenements/${slug}?message=statut`);
}
