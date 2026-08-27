"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppRole } from "@/lib/gazettes";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PUBLICATION_STATUSES = new Set(["draft", "published", "archived"]);
const ARTICLE_KINDS = new Set(["lead", "column", "brief", "recipe", "quote", "article"]);

async function requireAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims || typeof claims.sub !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fadministration%2Fgazettes");
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

function readGazetteFields(formData: FormData) {
  const title = String(formData.get("title") ?? "La Gazette d’Imetheran").trim().slice(0, 160) || "La Gazette d’Imetheran";
  const headline = String(formData.get("headline") ?? "").trim().slice(0, 220);
  const requestedSlug = slugify(String(formData.get("slug") ?? "").trim());
  const edition = String(formData.get("edition") ?? "").trim().slice(0, 180);
  const excerpt = String(formData.get("excerpt") ?? "").trim().slice(0, 8000);
  const coverImage = String(formData.get("cover_image") ?? "").trim().slice(0, 1200);
  const issueNumberRaw = Number.parseInt(String(formData.get("issue_number") ?? ""), 10);
  const highlights = String(formData.get("highlights") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((item) => item.slice(0, 80));

  return {
    title,
    headline,
    requestedSlug,
    edition,
    excerpt,
    cover_image: coverImage,
    requestedIssueNumber: Number.isFinite(issueNumberRaw) && issueNumberRaw >= 0 ? Math.min(issueNumberRaw, 9999) : null,
    highlights,
  };
}

async function gazetteSlug(supabase: Awaited<ReturnType<typeof createClient>>, id: string) {
  const { data } = await supabase.from("gazettes").select("slug").eq("id", id).maybeSingle();
  return data?.slug ?? null;
}

function refreshGazette(slug?: string | null) {
  revalidatePath("/");
  revalidatePath("/gazettes");
  revalidatePath("/administration");
  revalidatePath("/administration/gazettes");
  if (slug) revalidatePath(`/gazettes/${slug}`);
}

export async function createGazette(formData: FormData) {
  const fields = readGazetteFields(formData);
  if (!fields.headline) redirect("/administration/gazettes/nouveau?erreur=titre");

  const { supabase, userId } = await requireAdmin();
  let issueNumber = fields.requestedIssueNumber;
  if (issueNumber === null) {
    const { data: latest } = await supabase.from("gazettes").select("issue_number").order("issue_number", { ascending: false }).limit(1).maybeSingle();
    issueNumber = (latest?.issue_number ?? -1) + 1;
  }

  let slug = fields.requestedSlug || slugify(`numero-${issueNumber}-${fields.headline}`) || `gazette-${randomUUID().slice(0, 8)}`;
  const { data: existingSlug } = await supabase.from("gazettes").select("id").eq("slug", slug).maybeSingle();
  if (existingSlug) slug = `${slug.slice(0, 100)}-${randomUUID().slice(0, 6)}`;

  const { data, error } = await supabase
    .from("gazettes")
    .insert({
      slug,
      title: fields.title,
      headline: fields.headline,
      edition: fields.edition,
      issue_number: issueNumber,
      excerpt: fields.excerpt,
      publication_status: "draft",
      featured: false,
      cover_image: fields.cover_image,
      highlights: fields.highlights,
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();

  if (error || !data) redirect("/administration/gazettes/nouveau?erreur=enregistrement");
  refreshGazette();
  redirect(`/administration/gazettes/${data.id}?message=cree`);
}

export async function updateGazette(formData: FormData) {
  const gazetteId = String(formData.get("gazette_id") ?? "");
  if (!UUID_PATTERN.test(gazetteId)) redirect("/administration/gazettes?erreur=introuvable");
  const fields = readGazetteFields(formData);
  if (!fields.headline) redirect(`/administration/gazettes/${gazetteId}?erreur=titre`);

  const { supabase, userId } = await requireAdmin();
  const { data: current } = await supabase.from("gazettes").select("slug, issue_number").eq("id", gazetteId).maybeSingle();
  if (!current) redirect("/administration/gazettes?erreur=introuvable");
  const slug = fields.requestedSlug || slugify(`numero-${fields.requestedIssueNumber ?? current.issue_number}-${fields.headline}`) || current.slug;

  const { error } = await supabase
    .from("gazettes")
    .update({
      slug,
      title: fields.title,
      headline: fields.headline,
      edition: fields.edition,
      issue_number: fields.requestedIssueNumber ?? current.issue_number,
      excerpt: fields.excerpt,
      cover_image: fields.cover_image,
      highlights: fields.highlights,
      updated_by: userId,
    })
    .eq("id", gazetteId);

  if (error) redirect(`/administration/gazettes/${gazetteId}?erreur=enregistrement`);
  refreshGazette(current.slug);
  refreshGazette(slug);
  redirect(`/administration/gazettes/${gazetteId}?message=enregistre`);
}

export async function setGazettePublication(formData: FormData) {
  const gazetteId = String(formData.get("gazette_id") ?? "");
  const status = String(formData.get("publication_status") ?? "");
  if (!UUID_PATTERN.test(gazetteId) || !PUBLICATION_STATUSES.has(status)) redirect("/administration/gazettes?erreur=donnees");

  const { supabase, userId } = await requireAdmin();
  const { data: gazette } = await supabase.from("gazettes").select("slug, headline, excerpt, published_at").eq("id", gazetteId).maybeSingle();
  if (!gazette) redirect("/administration/gazettes?erreur=introuvable");
  if (status === "published" && (!gazette.headline.trim() || !gazette.excerpt.trim())) {
    redirect(`/administration/gazettes/${gazetteId}?erreur=publication`);
  }

  const payload: Record<string, unknown> = { publication_status: status, updated_by: userId };
  if (status === "published" && !gazette.published_at) payload.published_at = new Date().toISOString();
  if (status !== "published") payload.featured = false;

  const { error } = await supabase.from("gazettes").update(payload).eq("id", gazetteId);
  if (error) redirect(`/administration/gazettes/${gazetteId}?erreur=enregistrement`);
  refreshGazette(gazette.slug);
  redirect(`/administration/gazettes/${gazetteId}?message=${status}`);
}

export async function featureGazette(formData: FormData) {
  const gazetteId = String(formData.get("gazette_id") ?? "");
  if (!UUID_PATTERN.test(gazetteId)) redirect("/administration/gazettes?erreur=donnees");
  const { supabase, userId } = await requireAdmin();
  const { data: gazette } = await supabase.from("gazettes").select("slug, publication_status").eq("id", gazetteId).maybeSingle();
  if (!gazette || gazette.publication_status !== "published") redirect(`/administration/gazettes/${gazetteId}?erreur=publication`);

  const { error: clearError } = await supabase.from("gazettes").update({ featured: false, updated_by: userId }).neq("id", gazetteId).eq("featured", true);
  if (clearError) redirect(`/administration/gazettes/${gazetteId}?erreur=enregistrement`);
  const { error } = await supabase.from("gazettes").update({ featured: true, updated_by: userId }).eq("id", gazetteId);
  if (error) redirect(`/administration/gazettes/${gazetteId}?erreur=enregistrement`);

  refreshGazette(gazette.slug);
  redirect(`/administration/gazettes/${gazetteId}?message=vedette`);
}

export async function createGazetteArticle(formData: FormData) {
  const gazetteId = String(formData.get("gazette_id") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 220);
  if (!UUID_PATTERN.test(gazetteId) || !title) redirect(`/administration/gazettes/${gazetteId}?erreur=article`);
  const { supabase } = await requireAdmin();
  const { data: last } = await supabase.from("gazette_articles").select("sort_order").eq("gazette_id", gazetteId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("gazette_articles").insert({ gazette_id: gazetteId, title, kind: "article", sort_order: (last?.sort_order ?? -1) + 1 });
  if (error) redirect(`/administration/gazettes/${gazetteId}?erreur=article`);
  const slug = await gazetteSlug(supabase, gazetteId);
  refreshGazette(slug);
  redirect(`/administration/gazettes/${gazetteId}?message=article-cree`);
}

export async function updateGazetteArticle(formData: FormData) {
  const gazetteId = String(formData.get("gazette_id") ?? "");
  const articleId = String(formData.get("article_id") ?? "");
  if (!UUID_PATTERN.test(gazetteId) || !UUID_PATTERN.test(articleId)) redirect("/administration/gazettes?erreur=donnees");
  const title = String(formData.get("title") ?? "").trim().slice(0, 220);
  if (!title) redirect(`/administration/gazettes/${gazetteId}?erreur=article`);
  const kindRaw = String(formData.get("kind") ?? "article");
  const sortOrder = Math.max(0, Number.parseInt(String(formData.get("sort_order") ?? "0"), 10) || 0);
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("gazette_articles")
    .update({
      kind: ARTICLE_KINDS.has(kindRaw) ? kindRaw : "article",
      kicker: String(formData.get("kicker") ?? "").trim().slice(0, 120),
      title,
      body: String(formData.get("body") ?? "").trim().slice(0, 50000),
      byline: String(formData.get("byline") ?? "").trim().slice(0, 160),
      aside: String(formData.get("aside") ?? "").trim().slice(0, 8000),
      sort_order: sortOrder,
    })
    .eq("id", articleId)
    .eq("gazette_id", gazetteId);

  if (error) redirect(`/administration/gazettes/${gazetteId}?erreur=article`);
  const slug = await gazetteSlug(supabase, gazetteId);
  refreshGazette(slug);
  redirect(`/administration/gazettes/${gazetteId}?message=article-enregistre`);
}

export async function deleteGazetteArticle(formData: FormData) {
  const gazetteId = String(formData.get("gazette_id") ?? "");
  const articleId = String(formData.get("article_id") ?? "");
  if (!UUID_PATTERN.test(gazetteId) || !UUID_PATTERN.test(articleId)) redirect("/administration/gazettes?erreur=donnees");
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("gazette_articles").delete().eq("id", articleId).eq("gazette_id", gazetteId);
  if (error) redirect(`/administration/gazettes/${gazetteId}?erreur=article`);
  const slug = await gazetteSlug(supabase, gazetteId);
  refreshGazette(slug);
  redirect(`/administration/gazettes/${gazetteId}?message=article-supprime`);
}
