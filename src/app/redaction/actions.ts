"use server";

import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canAccessContent, getCmsAccess, type CmsContentType } from "@/lib/cms-access";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NARRATIVE_STATUSES = new Set(["upcoming", "open", "closed"]);
const CHAPTER_STATUSES = new Set(["completed", "active", "upcoming"]);
const ARTICLE_KINDS = new Set(["lead", "column", "brief", "recipe", "quote", "article"]);
const EDITORIAL_ACTIONS = new Set(["submit", "changes_requested", "staff_approved", "publish", "draft", "archive"]);
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const IMAGE_MAX_BYTES = 4 * 1024 * 1024;

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 110);
}

function normalizeHttpUrl(value: string) {
  const trimmed = value.trim().slice(0, 1200);
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString().slice(0, 1200) : "";
  } catch {
    return "";
  }
}

function readImage(formData: FormData) {
  const value = formData.get("cover_file");
  return value instanceof File && value.size > 0 ? value : null;
}

function validImage(file: File) {
  return file.size <= IMAGE_MAX_BYTES && IMAGE_TYPES.has(file.type);
}

async function requireCms(type: CmsContentType, returnPath = "/redaction") {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims || typeof claims.sub !== "string") {
    redirect(`/connexion?message=connexion-requise&retour=${encodeURIComponent(returnPath)}`);
  }
  const access = await getCmsAccess(supabase, claims.sub, claims.app_metadata);
  if (!access.hasAccess || !canAccessContent(access, type)) redirect("/compte");
  return { supabase, userId: claims.sub, access };
}

function refreshEditorial(type: CmsContentType, slug?: string | null) {
  revalidatePath("/");
  revalidatePath("/redaction");
  if (type === "chronicle") {
    revalidatePath("/chroniques");
    revalidatePath("/administration/chroniques");
    if (slug) revalidatePath(`/chroniques/${slug}`);
  } else {
    revalidatePath("/gazettes");
    revalidatePath("/administration/gazettes");
    if (slug) revalidatePath(`/gazettes/${slug}`);
  }
}

async function uploadCover(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bucket: "chronicle-covers" | "gazette-covers",
  contentId: string,
  file: File,
) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const path = `${contentId}/cover`;
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: true,
  });
  if (error) return null;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function createChronicleDraft(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim().slice(0, 160);
  const synopsis = String(formData.get("synopsis") ?? "").trim().slice(0, 8000);
  if (!title) redirect("/redaction/chroniques/nouveau?erreur=titre");

  const coverFile = readImage(formData);
  if (coverFile && !validImage(coverFile)) redirect("/redaction/chroniques/nouveau?erreur=couverture");
  const { supabase, userId } = await requireCms("chronicle", "/redaction/chroniques/nouveau");
  let slug = slugify(String(formData.get("slug") ?? "")) || slugify(title) || `chronique-${randomUUID().slice(0, 8)}`;
  const { data: existing } = await supabase.from("chronicles").select("id").eq("slug", slug).maybeSingle();
  if (existing) slug = `${slug.slice(0, 100)}-${randomUUID().slice(0, 6)}`;

  const narrative = String(formData.get("narrative_status") ?? "upcoming");
  const tags = String(formData.get("tags") ?? "").split(",").map((v) => v.trim()).filter(Boolean).slice(0, 10).map((v) => v.slice(0, 48));
  const startedAt = String(formData.get("started_at") ?? "").trim();
  const { data: chronicle, error } = await supabase.from("chronicles").insert({
    slug,
    title,
    subtitle: String(formData.get("subtitle") ?? "").trim().slice(0, 240),
    synopsis,
    hook: String(formData.get("hook") ?? "").trim().slice(0, 5000),
    narrative_status: NARRATIVE_STATUSES.has(narrative) ? narrative : "upcoming",
    publication_status: "draft",
    featured: false,
    cover_image: normalizeHttpUrl(String(formData.get("cover_url") ?? "")),
    started_at: /^\d{4}-\d{2}-\d{2}$/.test(startedAt) ? startedAt : null,
    location: String(formData.get("location") ?? "").trim().slice(0, 200),
    organizer: String(formData.get("organizer") ?? "").trim().slice(0, 160),
    tags,
    created_by: userId,
    updated_by: userId,
  }).select("id").single();

  if (error || !chronicle) redirect("/redaction/chroniques/nouveau?erreur=enregistrement");
  if (coverFile) {
    const uploaded = await uploadCover(supabase, "chronicle-covers", chronicle.id, coverFile);
    if (!uploaded) redirect(`/redaction/chroniques/${chronicle.id}?erreur=couverture`);
    await supabase.from("chronicles").update({ cover_image: uploaded, updated_by: userId }).eq("id", chronicle.id);
  }
  refreshEditorial("chronicle");
  redirect(`/redaction/chroniques/${chronicle.id}?message=cree`);
}

export async function updateChronicleDraft(formData: FormData) {
  const id = String(formData.get("chronicle_id") ?? "");
  if (!UUID_PATTERN.test(id)) redirect("/redaction?erreur=introuvable");
  const { supabase, userId } = await requireCms("chronicle", `/redaction/chroniques/${id}`);
  const { data: current } = await supabase.from("chronicles").select("slug, cover_image, publication_status").eq("id", id).maybeSingle();
  if (!current) redirect("/redaction?erreur=introuvable");
  const title = String(formData.get("title") ?? "").trim().slice(0, 160);
  if (!title) redirect(`/redaction/chroniques/${id}?erreur=titre`);
  const coverFile = readImage(formData);
  if (coverFile && !validImage(coverFile)) redirect(`/redaction/chroniques/${id}?erreur=couverture`);

  let coverImage = normalizeHttpUrl(String(formData.get("cover_url") ?? "")) || String(current.cover_image ?? "");
  if (coverFile) {
    const uploaded = await uploadCover(supabase, "chronicle-covers", id, coverFile);
    if (!uploaded) redirect(`/redaction/chroniques/${id}?erreur=couverture`);
    coverImage = uploaded;
  } else if (formData.get("remove_cover") === "on") {
    const { error: removeError } = await supabase.storage.from("chronicle-covers").remove([`${id}/cover`]);
    if (removeError) redirect(`/redaction/chroniques/${id}?erreur=couverture`);
    coverImage = "";
  }

  const narrative = String(formData.get("narrative_status") ?? "upcoming");
  const tags = String(formData.get("tags") ?? "").split(",").map((v) => v.trim()).filter(Boolean).slice(0, 10).map((v) => v.slice(0, 48));
  const startedAt = String(formData.get("started_at") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? "")) || slugify(title) || current.slug;
  const { error } = await supabase.from("chronicles").update({
    slug,
    title,
    subtitle: String(formData.get("subtitle") ?? "").trim().slice(0, 240),
    synopsis: String(formData.get("synopsis") ?? "").trim().slice(0, 8000),
    hook: String(formData.get("hook") ?? "").trim().slice(0, 5000),
    narrative_status: NARRATIVE_STATUSES.has(narrative) ? narrative : "upcoming",
    cover_image: coverImage,
    started_at: /^\d{4}-\d{2}-\d{2}$/.test(startedAt) ? startedAt : null,
    location: String(formData.get("location") ?? "").trim().slice(0, 200),
    organizer: String(formData.get("organizer") ?? "").trim().slice(0, 160),
    tags,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) redirect(`/redaction/chroniques/${id}?erreur=enregistrement`);
  refreshEditorial("chronicle", current.slug);
  refreshEditorial("chronicle", slug);
  redirect(`/redaction/chroniques/${id}?message=enregistre`);
}

export async function createChronicleChapterDraft(formData: FormData) {
  const chronicleId = String(formData.get("chronicle_id") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 180);
  if (!UUID_PATTERN.test(chronicleId) || !title) redirect(`/redaction/chroniques/${chronicleId}?erreur=chapitre`);
  const { supabase } = await requireCms("chronicle", `/redaction/chroniques/${chronicleId}`);
  const { data: last } = await supabase.from("chronicle_chapters").select("sort_order").eq("chronicle_id", chronicleId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("chronicle_chapters").insert({ chronicle_id: chronicleId, title, act: "Nouvel acte", sort_order: (last?.sort_order ?? -1) + 1 });
  if (error) redirect(`/redaction/chroniques/${chronicleId}?erreur=chapitre`);
  revalidatePath(`/redaction/chroniques/${chronicleId}`);
  redirect(`/redaction/chroniques/${chronicleId}?message=chapitre-cree`);
}

export async function updateChronicleChapterDraft(formData: FormData) {
  const chronicleId = String(formData.get("chronicle_id") ?? "");
  const chapterId = String(formData.get("chapter_id") ?? "");
  if (!UUID_PATTERN.test(chronicleId) || !UUID_PATTERN.test(chapterId)) redirect("/redaction?erreur=donnees");
  const { supabase } = await requireCms("chronicle", `/redaction/chroniques/${chronicleId}`);
  const status = String(formData.get("status") ?? "upcoming");
  const title = String(formData.get("title") ?? "").trim().slice(0, 180);
  if (!title) redirect(`/redaction/chroniques/${chronicleId}?erreur=chapitre`);
  const { error } = await supabase.from("chronicle_chapters").update({
    act: String(formData.get("act") ?? "").trim().slice(0, 80),
    title,
    summary: String(formData.get("summary") ?? "").trim().slice(0, 6000),
    body: String(formData.get("body") ?? "").trim().slice(0, 50000),
    status: CHAPTER_STATUSES.has(status) ? status : "upcoming",
    sort_order: Math.max(0, Number.parseInt(String(formData.get("sort_order") ?? "0"), 10) || 0),
    updated_at: new Date().toISOString(),
  }).eq("id", chapterId).eq("chronicle_id", chronicleId);
  if (error) redirect(`/redaction/chroniques/${chronicleId}?erreur=chapitre`);
  revalidatePath(`/redaction/chroniques/${chronicleId}`);
  redirect(`/redaction/chroniques/${chronicleId}?message=chapitre-enregistre`);
}

export async function deleteChronicleChapterDraft(formData: FormData) {
  const chronicleId = String(formData.get("chronicle_id") ?? "");
  const chapterId = String(formData.get("chapter_id") ?? "");
  if (!UUID_PATTERN.test(chronicleId) || !UUID_PATTERN.test(chapterId)) redirect("/redaction?erreur=donnees");
  const { supabase } = await requireCms("chronicle", `/redaction/chroniques/${chronicleId}`);
  const { error } = await supabase.from("chronicle_chapters").delete().eq("id", chapterId).eq("chronicle_id", chronicleId);
  if (error) redirect(`/redaction/chroniques/${chronicleId}?erreur=chapitre`);
  revalidatePath(`/redaction/chroniques/${chronicleId}`);
  redirect(`/redaction/chroniques/${chronicleId}?message=chapitre-supprime`);
}

export async function addChronicleParticipantDraft(formData: FormData) {
  const chronicleId = String(formData.get("chronicle_id") ?? "");
  const characterIdRaw = String(formData.get("character_id") ?? "");
  const label = String(formData.get("label") ?? "").trim().slice(0, 160);
  if (!UUID_PATTERN.test(chronicleId) || !label) redirect(`/redaction/chroniques/${chronicleId}?erreur=participant`);
  const { supabase } = await requireCms("chronicle", `/redaction/chroniques/${chronicleId}`);
  const { data: last } = await supabase.from("chronicle_participants").select("sort_order").eq("chronicle_id", chronicleId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("chronicle_participants").insert({
    chronicle_id: chronicleId,
    character_id: UUID_PATTERN.test(characterIdRaw) ? characterIdRaw : null,
    label,
    sort_order: (last?.sort_order ?? -1) + 1,
  });
  if (error) redirect(`/redaction/chroniques/${chronicleId}?erreur=participant`);
  revalidatePath(`/redaction/chroniques/${chronicleId}`);
  redirect(`/redaction/chroniques/${chronicleId}?message=participant`);
}

export async function removeChronicleParticipantDraft(formData: FormData) {
  const chronicleId = String(formData.get("chronicle_id") ?? "");
  const participantId = String(formData.get("participant_id") ?? "");
  if (!UUID_PATTERN.test(chronicleId) || !UUID_PATTERN.test(participantId)) redirect("/redaction?erreur=donnees");
  const { supabase } = await requireCms("chronicle", `/redaction/chroniques/${chronicleId}`);
  const { error } = await supabase.from("chronicle_participants").delete().eq("id", participantId).eq("chronicle_id", chronicleId);
  if (error) redirect(`/redaction/chroniques/${chronicleId}?erreur=participant`);
  revalidatePath(`/redaction/chroniques/${chronicleId}`);
  redirect(`/redaction/chroniques/${chronicleId}?message=participant-retire`);
}

export async function createGazetteDraft(formData: FormData) {
  const headline = String(formData.get("headline") ?? "").trim().slice(0, 220);
  if (!headline) redirect("/redaction/gazettes/nouveau?erreur=titre");
  const coverFile = readImage(formData);
  if (coverFile && !validImage(coverFile)) redirect("/redaction/gazettes/nouveau?erreur=couverture");
  const { supabase, userId } = await requireCms("gazette", "/redaction/gazettes/nouveau");
  const requestedIssue = Number.parseInt(String(formData.get("issue_number") ?? ""), 10);
  let issueNumber = Number.isFinite(requestedIssue) && requestedIssue >= 0 ? Math.min(requestedIssue, 9999) : null;
  if (issueNumber === null) {
    const { data: latest } = await supabase.from("gazettes").select("issue_number").order("issue_number", { ascending: false }).limit(1).maybeSingle();
    issueNumber = (latest?.issue_number ?? -1) + 1;
  }
  let slug = slugify(String(formData.get("slug") ?? "")) || slugify(`numero-${issueNumber}-${headline}`) || `gazette-${randomUUID().slice(0, 8)}`;
  const { data: existing } = await supabase.from("gazettes").select("id").eq("slug", slug).maybeSingle();
  if (existing) slug = `${slug.slice(0, 100)}-${randomUUID().slice(0, 6)}`;
  const highlights = String(formData.get("highlights") ?? "").split(",").map((v) => v.trim()).filter(Boolean).slice(0, 8).map((v) => v.slice(0, 80));
  const { data: gazette, error } = await supabase.from("gazettes").insert({
    slug,
    issue_number: issueNumber,
    title: String(formData.get("title") ?? "La Gazette d’Imetheran").trim().slice(0, 160) || "La Gazette d’Imetheran",
    edition: String(formData.get("edition") ?? "").trim().slice(0, 180),
    headline,
    excerpt: String(formData.get("excerpt") ?? "").trim().slice(0, 8000),
    cover_image: normalizeHttpUrl(String(formData.get("cover_url") ?? "")),
    highlights,
    publication_status: "draft",
    featured: false,
    created_by: userId,
    updated_by: userId,
  }).select("id").single();
  if (error || !gazette) redirect("/redaction/gazettes/nouveau?erreur=enregistrement");
  if (coverFile) {
    const uploaded = await uploadCover(supabase, "gazette-covers", gazette.id, coverFile);
    if (!uploaded) redirect(`/redaction/gazettes/${gazette.id}?erreur=couverture`);
    await supabase.from("gazettes").update({ cover_image: uploaded, updated_by: userId }).eq("id", gazette.id);
  }
  refreshEditorial("gazette");
  redirect(`/redaction/gazettes/${gazette.id}?message=cree`);
}

export async function updateGazetteDraft(formData: FormData) {
  const id = String(formData.get("gazette_id") ?? "");
  if (!UUID_PATTERN.test(id)) redirect("/redaction?erreur=introuvable");
  const { supabase, userId } = await requireCms("gazette", `/redaction/gazettes/${id}`);
  const { data: current } = await supabase.from("gazettes").select("slug, issue_number, cover_image, publication_status").eq("id", id).maybeSingle();
  if (!current) redirect("/redaction?erreur=introuvable");
  const headline = String(formData.get("headline") ?? "").trim().slice(0, 220);
  if (!headline) redirect(`/redaction/gazettes/${id}?erreur=titre`);
  const coverFile = readImage(formData);
  if (coverFile && !validImage(coverFile)) redirect(`/redaction/gazettes/${id}?erreur=couverture`);
  let coverImage = normalizeHttpUrl(String(formData.get("cover_url") ?? "")) || String(current.cover_image ?? "");
  if (coverFile) {
    const uploaded = await uploadCover(supabase, "gazette-covers", id, coverFile);
    if (!uploaded) redirect(`/redaction/gazettes/${id}?erreur=couverture`);
    coverImage = uploaded;
  } else if (formData.get("remove_cover") === "on") {
    const { error: removeError } = await supabase.storage.from("gazette-covers").remove([`${id}/cover`]);
    if (removeError) redirect(`/redaction/gazettes/${id}?erreur=couverture`);
    coverImage = "";
  }
  const requestedIssue = Number.parseInt(String(formData.get("issue_number") ?? ""), 10);
  const issueNumber = Number.isFinite(requestedIssue) && requestedIssue >= 0 ? Math.min(requestedIssue, 9999) : current.issue_number;
  const slug = slugify(String(formData.get("slug") ?? "")) || slugify(`numero-${issueNumber}-${headline}`) || current.slug;
  const highlights = String(formData.get("highlights") ?? "").split(",").map((v) => v.trim()).filter(Boolean).slice(0, 8).map((v) => v.slice(0, 80));
  const { error } = await supabase.from("gazettes").update({
    slug,
    issue_number: issueNumber,
    title: String(formData.get("title") ?? "La Gazette d’Imetheran").trim().slice(0, 160) || "La Gazette d’Imetheran",
    edition: String(formData.get("edition") ?? "").trim().slice(0, 180),
    headline,
    excerpt: String(formData.get("excerpt") ?? "").trim().slice(0, 8000),
    cover_image: coverImage,
    highlights,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) redirect(`/redaction/gazettes/${id}?erreur=enregistrement`);
  refreshEditorial("gazette", current.slug);
  refreshEditorial("gazette", slug);
  redirect(`/redaction/gazettes/${id}?message=enregistre`);
}

export async function createGazetteArticleDraft(formData: FormData) {
  const gazetteId = String(formData.get("gazette_id") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 220);
  if (!UUID_PATTERN.test(gazetteId) || !title) redirect(`/redaction/gazettes/${gazetteId}?erreur=article`);
  const { supabase } = await requireCms("gazette", `/redaction/gazettes/${gazetteId}`);
  const { data: last } = await supabase.from("gazette_articles").select("sort_order").eq("gazette_id", gazetteId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("gazette_articles").insert({ gazette_id: gazetteId, title, sort_order: (last?.sort_order ?? -1) + 1, kind: "article" });
  if (error) redirect(`/redaction/gazettes/${gazetteId}?erreur=article`);
  revalidatePath(`/redaction/gazettes/${gazetteId}`);
  redirect(`/redaction/gazettes/${gazetteId}?message=article-cree`);
}

export async function updateGazetteArticleDraft(formData: FormData) {
  const gazetteId = String(formData.get("gazette_id") ?? "");
  const articleId = String(formData.get("article_id") ?? "");
  if (!UUID_PATTERN.test(gazetteId) || !UUID_PATTERN.test(articleId)) redirect("/redaction?erreur=donnees");
  const { supabase } = await requireCms("gazette", `/redaction/gazettes/${gazetteId}`);
  const title = String(formData.get("title") ?? "").trim().slice(0, 220);
  const kind = String(formData.get("kind") ?? "article");
  if (!title) redirect(`/redaction/gazettes/${gazetteId}?erreur=article`);
  const { error } = await supabase.from("gazette_articles").update({
    sort_order: Math.max(0, Number.parseInt(String(formData.get("sort_order") ?? "0"), 10) || 0),
    kind: ARTICLE_KINDS.has(kind) ? kind : "article",
    kicker: String(formData.get("kicker") ?? "").trim().slice(0, 120),
    title,
    byline: String(formData.get("byline") ?? "").trim().slice(0, 160),
    aside: String(formData.get("aside") ?? "").trim().slice(0, 4000),
    body: String(formData.get("body") ?? "").trim().slice(0, 50000),
    updated_at: new Date().toISOString(),
  }).eq("id", articleId).eq("gazette_id", gazetteId);
  if (error) redirect(`/redaction/gazettes/${gazetteId}?erreur=article`);
  revalidatePath(`/redaction/gazettes/${gazetteId}`);
  redirect(`/redaction/gazettes/${gazetteId}?message=article-enregistre`);
}

export async function deleteGazetteArticleDraft(formData: FormData) {
  const gazetteId = String(formData.get("gazette_id") ?? "");
  const articleId = String(formData.get("article_id") ?? "");
  if (!UUID_PATTERN.test(gazetteId) || !UUID_PATTERN.test(articleId)) redirect("/redaction?erreur=donnees");
  const { supabase } = await requireCms("gazette", `/redaction/gazettes/${gazetteId}`);
  const { error } = await supabase.from("gazette_articles").delete().eq("id", articleId).eq("gazette_id", gazetteId);
  if (error) redirect(`/redaction/gazettes/${gazetteId}?erreur=article`);
  revalidatePath(`/redaction/gazettes/${gazetteId}`);
  redirect(`/redaction/gazettes/${gazetteId}?message=article-supprime`);
}

export async function transitionEditorialContent(formData: FormData) {
  const typeRaw = String(formData.get("content_type") ?? "");
  const type: CmsContentType | null = typeRaw === "chronicle" || typeRaw === "gazette" ? typeRaw : null;
  const id = String(formData.get("content_id") ?? "");
  const action = String(formData.get("action") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 2000);
  if (!type || !UUID_PATTERN.test(id) || !EDITORIAL_ACTIONS.has(action)) redirect("/redaction?erreur=donnees");

  const { supabase, userId, access } = await requireCms(type, "/redaction");
  const table = type === "chronicle" ? "chronicles" : "gazettes";
  const { data: row } = await supabase.from(table).select("id, slug, created_by, publication_status, published_at, title, synopsis, headline, excerpt").eq("id", id).maybeSingle();
  if (!row) redirect("/redaction?erreur=introuvable");

  const status = String(row.publication_status);
  let nextStatus = status;
  if (action === "submit") {
    if (!(["draft", "changes_requested"].includes(status)) || (!access.isAdmin && access.cmsRole !== "editor" && row.created_by !== userId)) {
      redirect("/redaction?erreur=transition");
    }
    nextStatus = "submitted";
  } else if (action === "changes_requested" || action === "staff_approved") {
    if (!access.canReview || status !== "submitted") redirect("/redaction?erreur=transition");
    if (action === "changes_requested" && note.length < 3) redirect("/redaction?erreur=note");
    nextStatus = action;
  } else if (action === "publish") {
    if (!access.isAdmin || status !== "staff_approved") redirect("/redaction?erreur=transition");
    const ready = type === "chronicle"
      ? Boolean(String(row.title ?? "").trim() && String(row.synopsis ?? "").trim())
      : Boolean(String(row.headline ?? "").trim() && String(row.excerpt ?? "").trim());
    if (!ready) redirect("/redaction?erreur=publication");
    nextStatus = "published";
  } else if (action === "archive") {
    if (!access.isAdmin) redirect("/redaction?erreur=transition");
    nextStatus = "archived";
  } else if (action === "draft") {
    const canReturn = access.isAdmin || (row.created_by === userId && status === "changes_requested");
    if (!canReturn) redirect("/redaction?erreur=transition");
    nextStatus = "draft";
  }

  const payload: Record<string, unknown> = {
    publication_status: nextStatus,
    review_note: action === "submit" ? "" : note,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };
  if (nextStatus === "published" && !row.published_at) payload.published_at = new Date().toISOString();
  if (nextStatus !== "published") payload.featured = false;

  const { error } = await supabase.from(table).update(payload).eq("id", id);
  if (error) redirect(`/redaction?erreur=${error.message.includes("staff_approval_required") ? "validation-staff" : "enregistrement"}`);
  refreshEditorial(type, String(row.slug ?? ""));
  revalidatePath(`/redaction/${type === "chronicle" ? "chroniques" : "gazettes"}/${id}`);
  redirect(`/redaction?message=${nextStatus}`);
}
