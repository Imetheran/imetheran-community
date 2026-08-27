"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAppRole } from "@/lib/chronicles";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NARRATIVE_STATUSES = new Set(["upcoming", "open", "closed"]);
const CHAPTER_STATUSES = new Set(["completed", "active", "upcoming"]);
const PUBLICATION_STATUSES = new Set(["draft", "published", "archived"]);

async function requireAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims || typeof claims.sub !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fadministration%2Fchroniques");
  }
  if (getAppRole(claims.app_metadata) !== "admin") redirect("/compte");
  return { supabase, userId: claims.sub };
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 110);
}

function readChronicleFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim().slice(0, 160);
  const requestedSlug = slugify(String(formData.get("slug") ?? "").trim());
  const subtitle = String(formData.get("subtitle") ?? "").trim().slice(0, 240);
  const synopsis = String(formData.get("synopsis") ?? "").trim().slice(0, 8000);
  const hook = String(formData.get("hook") ?? "").trim().slice(0, 5000);
  const location = String(formData.get("location") ?? "").trim().slice(0, 200);
  const organizer = String(formData.get("organizer") ?? "").trim().slice(0, 160);
  const coverImage = String(formData.get("cover_image") ?? "").trim().slice(0, 1200);
  const startedAtRaw = String(formData.get("started_at") ?? "").trim();
  const narrativeStatusRaw = String(formData.get("narrative_status") ?? "upcoming");
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 10)
    .map((tag) => tag.slice(0, 48));

  return {
    title,
    requestedSlug,
    subtitle,
    synopsis,
    hook,
    location,
    organizer,
    cover_image: coverImage,
    started_at: /^\d{4}-\d{2}-\d{2}$/.test(startedAtRaw) ? startedAtRaw : null,
    narrative_status: NARRATIVE_STATUSES.has(narrativeStatusRaw) ? narrativeStatusRaw : "upcoming",
    tags,
  };
}

async function chronicleSlug(supabase: Awaited<ReturnType<typeof createClient>>, id: string) {
  const { data } = await supabase.from("chronicles").select("slug").eq("id", id).maybeSingle();
  return data?.slug ?? null;
}

function refreshChronicle(slug?: string | null) {
  revalidatePath("/");
  revalidatePath("/chroniques");
  revalidatePath("/administration");
  revalidatePath("/administration/chroniques");
  if (slug) revalidatePath(`/chroniques/${slug}`);
}

export async function createChronicle(formData: FormData) {
  const fields = readChronicleFields(formData);
  if (!fields.title) redirect("/administration/chroniques/nouveau?erreur=titre");

  const { supabase, userId } = await requireAdmin();
  let slug = fields.requestedSlug || slugify(fields.title) || `chronique-${randomUUID().slice(0, 8)}`;
  const { data: existing } = await supabase.from("chronicles").select("id").eq("slug", slug).maybeSingle();
  if (existing) slug = `${slug.slice(0, 100)}-${randomUUID().slice(0, 6)}`;

  const { data, error } = await supabase
    .from("chronicles")
    .insert({
      slug,
      title: fields.title,
      subtitle: fields.subtitle,
      synopsis: fields.synopsis,
      hook: fields.hook,
      narrative_status: fields.narrative_status,
      publication_status: "draft",
      featured: false,
      cover_image: fields.cover_image,
      started_at: fields.started_at,
      location: fields.location,
      organizer: fields.organizer,
      tags: fields.tags,
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();
  if (error || !data) redirect("/administration/chroniques/nouveau?erreur=enregistrement");
  refreshChronicle();
  redirect(`/administration/chroniques/${data.id}?message=cree`);
}

export async function updateChronicle(formData: FormData) {
  const chronicleId = String(formData.get("chronicle_id") ?? "");
  if (!UUID_PATTERN.test(chronicleId)) redirect("/administration/chroniques?erreur=introuvable");
  const fields = readChronicleFields(formData);
  if (!fields.title) redirect(`/administration/chroniques/${chronicleId}?erreur=titre`);

  const { supabase, userId } = await requireAdmin();
  const beforeSlug = await chronicleSlug(supabase, chronicleId);
  const slug = fields.requestedSlug || slugify(fields.title) || beforeSlug;
  const { error } = await supabase
    .from("chronicles")
    .update({
      slug,
      title: fields.title,
      subtitle: fields.subtitle,
      synopsis: fields.synopsis,
      hook: fields.hook,
      narrative_status: fields.narrative_status,
      cover_image: fields.cover_image,
      started_at: fields.started_at,
      location: fields.location,
      organizer: fields.organizer,
      tags: fields.tags,
      updated_by: userId,
    })
    .eq("id", chronicleId);
  if (error) redirect(`/administration/chroniques/${chronicleId}?erreur=enregistrement`);
  refreshChronicle(beforeSlug);
  refreshChronicle(slug);
  redirect(`/administration/chroniques/${chronicleId}?message=enregistre`);
}

export async function setChroniclePublication(formData: FormData) {
  const chronicleId = String(formData.get("chronicle_id") ?? "");
  const status = String(formData.get("publication_status") ?? "");
  if (!UUID_PATTERN.test(chronicleId) || !PUBLICATION_STATUSES.has(status)) redirect("/administration/chroniques?erreur=donnees");

  const { supabase, userId } = await requireAdmin();
  const { data: chronicle } = await supabase.from("chronicles").select("slug, title, synopsis").eq("id", chronicleId).maybeSingle();
  if (!chronicle) redirect("/administration/chroniques?erreur=introuvable");
  if (status === "published" && (!chronicle.title.trim() || !chronicle.synopsis.trim())) {
    redirect(`/administration/chroniques/${chronicleId}?erreur=publication`);
  }

  const { error } = await supabase
    .from("chronicles")
    .update({ publication_status: status, featured: status === "published" ? undefined : false, updated_by: userId })
    .eq("id", chronicleId);
  if (error) redirect(`/administration/chroniques/${chronicleId}?erreur=enregistrement`);
  refreshChronicle(chronicle.slug);
  redirect(`/administration/chroniques/${chronicleId}?message=${status}`);
}

export async function featureChronicle(formData: FormData) {
  const chronicleId = String(formData.get("chronicle_id") ?? "");
  if (!UUID_PATTERN.test(chronicleId)) redirect("/administration/chroniques?erreur=donnees");
  const { supabase, userId } = await requireAdmin();
  const { data: chronicle } = await supabase.from("chronicles").select("slug, publication_status").eq("id", chronicleId).maybeSingle();
  if (!chronicle || chronicle.publication_status !== "published") redirect(`/administration/chroniques/${chronicleId}?erreur=publication`);
  const { error } = await supabase.from("chronicles").update({ featured: true, updated_by: userId }).eq("id", chronicleId);
  if (error) redirect(`/administration/chroniques/${chronicleId}?erreur=enregistrement`);
  refreshChronicle(chronicle.slug);
  redirect(`/administration/chroniques/${chronicleId}?message=vedette`);
}

export async function createChronicleChapter(formData: FormData) {
  const chronicleId = String(formData.get("chronicle_id") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 180);
  if (!UUID_PATTERN.test(chronicleId) || !title) redirect(`/administration/chroniques/${chronicleId}?erreur=chapitre`);
  const { supabase } = await requireAdmin();
  const { data: last } = await supabase.from("chronicle_chapters").select("sort_order").eq("chronicle_id", chronicleId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("chronicle_chapters").insert({ chronicle_id: chronicleId, title, act: "Nouvel acte", sort_order: (last?.sort_order ?? -1) + 1 });
  if (error) redirect(`/administration/chroniques/${chronicleId}?erreur=chapitre`);
  const slug = await chronicleSlug(supabase, chronicleId);
  refreshChronicle(slug);
  redirect(`/administration/chroniques/${chronicleId}?message=chapitre-cree`);
}

export async function updateChronicleChapter(formData: FormData) {
  const chronicleId = String(formData.get("chronicle_id") ?? "");
  const chapterId = String(formData.get("chapter_id") ?? "");
  if (!UUID_PATTERN.test(chronicleId) || !UUID_PATTERN.test(chapterId)) redirect("/administration/chroniques?erreur=donnees");
  const title = String(formData.get("title") ?? "").trim().slice(0, 180);
  if (!title) redirect(`/administration/chroniques/${chronicleId}?erreur=chapitre`);
  const statusRaw = String(formData.get("status") ?? "upcoming");
  const topicIdRaw = String(formData.get("forum_topic_id") ?? "");
  const sortOrder = Math.max(0, Number.parseInt(String(formData.get("sort_order") ?? "0"), 10) || 0);
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("chronicle_chapters")
    .update({
      act: String(formData.get("act") ?? "").trim().slice(0, 80),
      title,
      summary: String(formData.get("summary") ?? "").trim().slice(0, 6000),
      body: String(formData.get("body") ?? "").trim().slice(0, 50000),
      status: CHAPTER_STATUSES.has(statusRaw) ? statusRaw : "upcoming",
      sort_order: sortOrder,
      forum_topic_id: UUID_PATTERN.test(topicIdRaw) ? topicIdRaw : null,
    })
    .eq("id", chapterId)
    .eq("chronicle_id", chronicleId);
  if (error) redirect(`/administration/chroniques/${chronicleId}?erreur=chapitre`);
  const slug = await chronicleSlug(supabase, chronicleId);
  refreshChronicle(slug);
  redirect(`/administration/chroniques/${chronicleId}?message=chapitre-enregistre`);
}

export async function deleteChronicleChapter(formData: FormData) {
  const chronicleId = String(formData.get("chronicle_id") ?? "");
  const chapterId = String(formData.get("chapter_id") ?? "");
  if (!UUID_PATTERN.test(chronicleId) || !UUID_PATTERN.test(chapterId)) redirect("/administration/chroniques?erreur=donnees");
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("chronicle_chapters").delete().eq("id", chapterId).eq("chronicle_id", chronicleId);
  if (error) redirect(`/administration/chroniques/${chronicleId}?erreur=chapitre`);
  const slug = await chronicleSlug(supabase, chronicleId);
  refreshChronicle(slug);
  redirect(`/administration/chroniques/${chronicleId}?message=chapitre-supprime`);
}

export async function addChronicleParticipant(formData: FormData) {
  const chronicleId = String(formData.get("chronicle_id") ?? "");
  const characterIdRaw = String(formData.get("character_id") ?? "");
  if (!UUID_PATTERN.test(chronicleId)) redirect("/administration/chroniques?erreur=donnees");
  const { supabase } = await requireAdmin();
  const characterId = UUID_PATTERN.test(characterIdRaw) ? characterIdRaw : null;
  let label = String(formData.get("label") ?? "").trim().slice(0, 120);
  if (!label && characterId) {
    const { data: character } = await supabase.from("characters").select("name").eq("id", characterId).maybeSingle();
    label = character?.name?.slice(0, 120) ?? "";
  }
  if (!label) redirect(`/administration/chroniques/${chronicleId}?erreur=participant`);
  const { data: last } = await supabase.from("chronicle_participants").select("sort_order").eq("chronicle_id", chronicleId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("chronicle_participants").insert({ chronicle_id: chronicleId, character_id: characterId, label, sort_order: (last?.sort_order ?? -1) + 1 });
  if (error) redirect(`/administration/chroniques/${chronicleId}?erreur=participant`);
  const slug = await chronicleSlug(supabase, chronicleId);
  refreshChronicle(slug);
  redirect(`/administration/chroniques/${chronicleId}?message=participant`);
}

export async function removeChronicleParticipant(formData: FormData) {
  const chronicleId = String(formData.get("chronicle_id") ?? "");
  const participantId = String(formData.get("participant_id") ?? "");
  if (!UUID_PATTERN.test(chronicleId) || !UUID_PATTERN.test(participantId)) redirect("/administration/chroniques?erreur=donnees");
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("chronicle_participants").delete().eq("id", participantId).eq("chronicle_id", chronicleId);
  if (error) redirect(`/administration/chroniques/${chronicleId}?erreur=participant`);
  const slug = await chronicleSlug(supabase, chronicleId);
  refreshChronicle(slug);
  redirect(`/administration/chroniques/${chronicleId}?message=participant-retire`);
}
