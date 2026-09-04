"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cleanupForumMedia, collectForumMediaForPostIds, postIdsForTopicIds, topicIdsForBoardIds } from "../delete-utils";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getRole(appMetadata: unknown) {
  if (!appMetadata || typeof appMetadata !== "object" || !("role" in appMetadata)) return "member";
  return String((appMetadata as { role?: unknown }).role ?? "member");
}

function redirectWith(key: "message" | "erreur", value: string): never {
  redirect(`/administration/forum/structure?${key}=${encodeURIComponent(value)}`);
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims || typeof claims.sub !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fadministration%2Fforum%2Fstructure");
  }
  if (getRole(claims.app_metadata) !== "admin") redirect("/compte");
  return supabase;
}

function refreshStructure() {
  revalidatePath("/");
  revalidatePath("/forum");
  revalidatePath("/forum/[board]", "page");
  revalidatePath("/forum/[board]/sujet/[topic]", "page");
  revalidatePath("/guides");
  revalidatePath("/chroniques");
  revalidatePath("/administration");
  revalidatePath("/administration/forum");
  revalidatePath("/administration/forum/structure");
}

async function collectBoardMedia(supabase: Awaited<ReturnType<typeof createClient>>, boardIds: string[]) {
  const topicsResult = await topicIdsForBoardIds(supabase, boardIds);
  if (topicsResult.error) return { manifest: null, error: topicsResult.error };
  const postsResult = await postIdsForTopicIds(supabase, topicsResult.topicIds);
  if (postsResult.error) return { manifest: null, error: postsResult.error };
  const mediaResult = await collectForumMediaForPostIds(supabase, postsResult.postIds);
  if (mediaResult.error) return { manifest: null, error: mediaResult.error };
  return { manifest: mediaResult.manifest, error: null };
}

export async function deleteForumBoard(formData: FormData) {
  const boardId = field(formData, "board_id");
  if (!UUID_PATTERN.test(boardId)) redirectWith("erreur", "forum-donnees");

  const supabase = await requireAdmin();
  const { data: board, error: boardError } = await supabase.from("forum_boards").select("id").eq("id", boardId).maybeSingle();
  if (boardError || !board) redirectWith("erreur", "forum-introuvable");

  const mediaResult = await collectBoardMedia(supabase, [boardId]);
  if (mediaResult.error || !mediaResult.manifest) redirectWith("erreur", "suppression-media");

  const { error: deleteError } = await supabase.from("forum_boards").delete().eq("id", boardId);
  if (deleteError) redirectWith("erreur", "forum-suppression");

  const cleanup = await cleanupForumMedia(supabase, mediaResult.manifest);
  refreshStructure();
  redirectWith("message", cleanup.failed ? "forum-supprime-stockage" : "forum-supprime");
}

export async function deleteForumSection(formData: FormData) {
  const sectionId = field(formData, "section_id");
  if (!UUID_PATTERN.test(sectionId)) redirectWith("erreur", "section-donnees");

  const supabase = await requireAdmin();
  const { data: section, error: sectionError } = await supabase.from("forum_sections").select("id").eq("id", sectionId).maybeSingle();
  if (sectionError || !section) redirectWith("erreur", "section-introuvable");

  const { data: boards, error: boardsError } = await supabase.from("forum_boards").select("id").eq("section_id", sectionId);
  if (boardsError) redirectWith("erreur", "section-suppression");
  const boardIds = (boards ?? []).map((board) => board.id);
  const mediaResult = await collectBoardMedia(supabase, boardIds);
  if (mediaResult.error || !mediaResult.manifest) redirectWith("erreur", "suppression-media");

  const { error: deleteError } = await supabase.from("forum_sections").delete().eq("id", sectionId);
  if (deleteError) redirectWith("erreur", "section-suppression");

  const cleanup = await cleanupForumMedia(supabase, mediaResult.manifest);
  refreshStructure();
  redirectWith("message", cleanup.failed ? "section-supprimee-stockage" : "section-supprimee");
}
