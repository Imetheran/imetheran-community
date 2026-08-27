"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SECTION_MODES = new Set(["rp", "non-rp"]);
const ACCESS_SCOPES = new Set(["guest-read", "members"]);
const BOARD_POLICIES = new Set(["members", "staff", "closed"]);

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getRole(appMetadata: unknown) {
  if (!appMetadata || typeof appMetadata !== "object" || !("role" in appMetadata)) return "member";
  return String((appMetadata as { role?: unknown }).role ?? "member");
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "espace";
}

function parseSort(value: string, fallback = 0) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 9999) return null;
  return parsed;
}

function redirectWith(key: "message" | "erreur", value: string): never {
  redirect(`/administration/forum/structure?${key}=${encodeURIComponent(value)}`);
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const role = getRole(claims?.app_metadata);

  if (error || !claims || typeof claims.sub !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fadministration%2Fforum%2Fstructure");
  }
  if (role !== "admin") redirect("/compte");

  return supabase;
}

async function uniqueSectionSlug(supabase: SupabaseClient, title: string) {
  const base = slugify(title);
  for (let index = 1; index <= 50; index += 1) {
    const candidate = index === 1 ? base : `${base}-${index}`;
    const { data } = await supabase.from("forum_sections").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return null;
}

async function uniqueBoardSlug(supabase: SupabaseClient, title: string) {
  const base = slugify(title);
  for (let index = 1; index <= 50; index += 1) {
    const candidate = index === 1 ? base : `${base}-${index}`;
    const { data } = await supabase.from("forum_boards").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return null;
}

async function nextSectionSort(supabase: SupabaseClient) {
  const { data } = await supabase.from("forum_sections").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  return (data?.sort_order ?? 0) + 10;
}

async function nextBoardSort(supabase: SupabaseClient, sectionId: string) {
  const { data } = await supabase
    .from("forum_boards")
    .select("sort_order")
    .eq("section_id", sectionId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.sort_order ?? 0) + 10;
}

async function sectionHasTopics(supabase: SupabaseClient, sectionId: string) {
  const { data: boards } = await supabase.from("forum_boards").select("id").eq("section_id", sectionId);
  const boardIds = (boards ?? []).map((board) => board.id);
  if (!boardIds.length) return false;
  const { count } = await supabase.from("forum_topics").select("id", { count: "exact", head: true }).in("board_id", boardIds);
  return (count ?? 0) > 0;
}

async function boardHasTopics(supabase: SupabaseClient, boardId: string) {
  const { count } = await supabase.from("forum_topics").select("id", { count: "exact", head: true }).eq("board_id", boardId);
  return (count ?? 0) > 0;
}

function refreshForumStructure() {
  revalidatePath("/administration/forum/structure");
  revalidatePath("/administration/forum");
  revalidatePath("/forum");
  revalidatePath("/guides");
}

export async function createForumSection(formData: FormData) {
  const title = field(formData, "title").slice(0, 100);
  const subtitle = field(formData, "subtitle").slice(0, 600);
  const mode = field(formData, "mode");
  const accessScope = field(formData, "access_scope");

  if (title.length < 2 || !SECTION_MODES.has(mode) || !ACCESS_SCOPES.has(accessScope)) {
    redirectWith("erreur", "section-donnees");
  }

  const supabase = await requireAdmin();
  const slug = await uniqueSectionSlug(supabase, title);
  if (!slug) redirectWith("erreur", "slug");

  const { error } = await supabase.from("forum_sections").insert({
    slug,
    title,
    subtitle,
    mode,
    access_scope: accessScope,
    sort_order: await nextSectionSort(supabase),
    is_active: true,
  });

  if (error) redirectWith("erreur", "section-creation");
  refreshForumStructure();
  redirectWith("message", "section-creee");
}

export async function updateForumSection(formData: FormData) {
  const sectionId = field(formData, "section_id");
  const title = field(formData, "title").slice(0, 100);
  const subtitle = field(formData, "subtitle").slice(0, 600);
  const mode = field(formData, "mode");
  const accessScope = field(formData, "access_scope");
  const sortOrder = parseSort(field(formData, "sort_order"));
  const isActive = field(formData, "status") === "active";

  if (!UUID_PATTERN.test(sectionId) || title.length < 2 || !SECTION_MODES.has(mode) || !ACCESS_SCOPES.has(accessScope) || sortOrder === null) {
    redirectWith("erreur", "section-donnees");
  }

  const supabase = await requireAdmin();
  const { data: current, error: currentError } = await supabase.from("forum_sections").select("mode").eq("id", sectionId).maybeSingle();
  if (currentError || !current) redirectWith("erreur", "section-introuvable");

  if (current.mode !== mode && await sectionHasTopics(supabase, sectionId)) {
    redirectWith("erreur", "mode-contenu");
  }

  const { error } = await supabase
    .from("forum_sections")
    .update({ title, subtitle, mode, access_scope: accessScope, sort_order: sortOrder, is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", sectionId);

  if (error) redirectWith("erreur", "section-maj");
  refreshForumStructure();
  redirectWith("message", isActive ? "section-maj" : "section-archivee");
}

export async function createForumBoard(formData: FormData) {
  const sectionId = field(formData, "section_id");
  const title = field(formData, "title").slice(0, 100);
  const description = field(formData, "description").slice(0, 1200);
  const badge = field(formData, "badge").slice(0, 60);
  const topicCreation = field(formData, "topic_creation");
  const replyPolicy = field(formData, "reply_policy");

  if (!UUID_PATTERN.test(sectionId) || title.length < 2 || !BOARD_POLICIES.has(topicCreation) || !BOARD_POLICIES.has(replyPolicy)) {
    redirectWith("erreur", "forum-donnees");
  }

  const supabase = await requireAdmin();
  const { data: section } = await supabase.from("forum_sections").select("id").eq("id", sectionId).maybeSingle();
  if (!section) redirectWith("erreur", "section-introuvable");

  const slug = await uniqueBoardSlug(supabase, title);
  if (!slug) redirectWith("erreur", "slug");

  const { error } = await supabase.from("forum_boards").insert({
    section_id: sectionId,
    slug,
    title,
    description,
    badge: badge || null,
    topic_creation: topicCreation,
    reply_policy: replyPolicy,
    sort_order: await nextBoardSort(supabase, sectionId),
    is_active: true,
  });

  if (error) redirectWith("erreur", "forum-creation");
  refreshForumStructure();
  redirectWith("message", "forum-cree");
}

export async function updateForumBoard(formData: FormData) {
  const boardId = field(formData, "board_id");
  const sectionId = field(formData, "section_id");
  const title = field(formData, "title").slice(0, 100);
  const description = field(formData, "description").slice(0, 1200);
  const badge = field(formData, "badge").slice(0, 60);
  const topicCreation = field(formData, "topic_creation");
  const replyPolicy = field(formData, "reply_policy");
  const sortOrder = parseSort(field(formData, "sort_order"));
  const isActive = field(formData, "status") === "active";

  if (!UUID_PATTERN.test(boardId) || !UUID_PATTERN.test(sectionId) || title.length < 2 || !BOARD_POLICIES.has(topicCreation) || !BOARD_POLICIES.has(replyPolicy) || sortOrder === null) {
    redirectWith("erreur", "forum-donnees");
  }

  const supabase = await requireAdmin();
  const { data: current, error: currentError } = await supabase.from("forum_boards").select("section_id").eq("id", boardId).maybeSingle();
  if (currentError || !current) redirectWith("erreur", "forum-introuvable");

  if (current.section_id !== sectionId) {
    const { data: sectionRows } = await supabase.from("forum_sections").select("id, mode").in("id", [current.section_id, sectionId]);
    const currentMode = sectionRows?.find((section) => section.id === current.section_id)?.mode;
    const targetMode = sectionRows?.find((section) => section.id === sectionId)?.mode;
    if (!targetMode) redirectWith("erreur", "section-introuvable");
    if (currentMode !== targetMode && await boardHasTopics(supabase, boardId)) {
      redirectWith("erreur", "deplacement-mode");
    }
  }

  const { error } = await supabase
    .from("forum_boards")
    .update({
      section_id: sectionId,
      title,
      description,
      badge: badge || null,
      topic_creation: topicCreation,
      reply_policy: replyPolicy,
      sort_order: sortOrder,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", boardId);

  if (error) redirectWith("erreur", "forum-maj");
  refreshForumStructure();
  redirectWith("message", isActive ? "forum-maj" : "forum-archive");
}
