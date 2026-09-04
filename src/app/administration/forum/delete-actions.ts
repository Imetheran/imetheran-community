"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cleanupForumMedia, collectForumMediaForPostIds, postIdsForTopicIds } from "./delete-utils";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getRole(appMetadata: unknown) {
  if (!appMetadata || typeof appMetadata !== "object" || !("role" in appMetadata)) return "member";
  return String((appMetadata as { role?: unknown }).role ?? "member");
}

function safeReturnTo(formData: FormData) {
  const value = field(formData, "return_to");
  return value.startsWith("/administration/forum") ? value.slice(0, 500) : "/administration/forum";
}

function redirectWith(returnTo: string, key: "message" | "erreur", value: string): never {
  const url = new URL(returnTo, "https://imetheran.local");
  url.searchParams.set(key, value);
  redirect(`${url.pathname}${url.search}`);
}

async function requireAdmin(returnTo: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims || typeof claims.sub !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fadministration%2Fforum");
  }
  if (getRole(claims.app_metadata) !== "admin") redirectWith(returnTo, "erreur", "admin-requis");
  return supabase;
}

function refreshForum() {
  revalidatePath("/");
  revalidatePath("/forum");
  revalidatePath("/forum/[board]", "page");
  revalidatePath("/forum/[board]/sujet/[topic]", "page");
  revalidatePath("/administration");
  revalidatePath("/administration/forum");
  revalidatePath("/administration/forum/structure");
}

export async function deleteForumPostFromAdmin(formData: FormData) {
  const postId = field(formData, "post_id");
  const returnTo = safeReturnTo(formData);
  if (!UUID_PATTERN.test(postId)) redirectWith(returnTo, "erreur", "donnees");

  const supabase = await requireAdmin(returnTo);
  const { data: post, error: postError } = await supabase.from("forum_posts").select("id, topic_id").eq("id", postId).maybeSingle();
  if (postError || !post) redirectWith(returnTo, "erreur", "message-introuvable");

  const { count, error: countError } = await supabase.from("forum_posts").select("id", { count: "exact", head: true }).eq("topic_id", post.topic_id);
  if (countError) redirectWith(returnTo, "erreur", "suppression-message");
  if ((count ?? 0) <= 1) redirectWith(returnTo, "erreur", "dernier-message");

  const { manifest, error: mediaError } = await collectForumMediaForPostIds(supabase, [postId]);
  if (mediaError) redirectWith(returnTo, "erreur", "suppression-media");

  const { error: deleteError } = await supabase.from("forum_posts").delete().eq("id", postId);
  if (deleteError) redirectWith(returnTo, "erreur", "suppression-message");

  const cleanup = await cleanupForumMedia(supabase, manifest);
  refreshForum();
  redirectWith(returnTo, "message", cleanup.failed ? "message-supprime-stockage" : "message-supprime");
}

export async function deleteForumTopicFromAdmin(formData: FormData) {
  const topicId = field(formData, "topic_id");
  const returnTo = safeReturnTo(formData);
  if (!UUID_PATTERN.test(topicId)) redirectWith(returnTo, "erreur", "donnees");

  const supabase = await requireAdmin(returnTo);
  const { data: topic, error: topicError } = await supabase.from("forum_topics").select("id").eq("id", topicId).maybeSingle();
  if (topicError || !topic) redirectWith(returnTo, "erreur", "sujet-introuvable");

  const postsResult = await postIdsForTopicIds(supabase, [topicId]);
  if (postsResult.error) redirectWith(returnTo, "erreur", "suppression-sujet");
  const { manifest, error: mediaError } = await collectForumMediaForPostIds(supabase, postsResult.postIds);
  if (mediaError) redirectWith(returnTo, "erreur", "suppression-media");

  const { error: deleteError } = await supabase.from("forum_topics").delete().eq("id", topicId);
  if (deleteError) redirectWith(returnTo, "erreur", "suppression-sujet");

  const cleanup = await cleanupForumMedia(supabase, manifest);
  refreshForum();
  redirectWith(returnTo, "message", cleanup.failed ? "sujet-supprime-stockage" : "sujet-supprime");
}
