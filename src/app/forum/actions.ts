"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canUseForumWritePolicy } from "@/lib/forum-access";
import { getMemberParticipation } from "@/lib/member-participation";
import { createClient } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9-]+$/;

type ForumModerationAction =
  | "pin"
  | "unpin"
  | "lock"
  | "unlock"
  | "finish"
  | "archive"
  | "reopen";

function readField(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function safeSlug(value: string) {
  return slugPattern.test(value) ? value : "";
}

function optionalUuid(value: string) {
  return uuidPattern.test(value) ? value : null;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 76) || "sujet";
}

function readTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => tag.slice(0, 32)),
    ),
  ).slice(0, 5);
}

function readRole(claims: Record<string, unknown> | undefined) {
  const appMetadata = claims?.app_metadata;
  if (!appMetadata || typeof appMetadata !== "object" || !("role" in appMetadata)) return "member";
  return String((appMetadata as { role?: unknown }).role ?? "member");
}

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  const claims = claimsData?.claims as Record<string, unknown> | undefined;
  const userId = claims?.sub;

  if (error || typeof userId !== "string") {
    return { supabase, userId: null, role: "member" };
  }

  return { supabase, userId, role: readRole(claims) };
}

function policyError(policy: string) {
  return policy === "closed" ? "fermee" : "reservee";
}

function safeThreadTarget(formData: FormData) {
  const boardSlug = safeSlug(readField(formData, "board_slug"));
  const topicSlug = safeSlug(readField(formData, "topic_slug"));
  const topicId = readField(formData, "topic_id");
  const postId = readField(formData, "post_id");
  if (!boardSlug || !topicSlug || !uuidPattern.test(topicId) || (postId && !uuidPattern.test(postId))) {
    redirect("/forum");
  }
  return { boardSlug, topicSlug, topicId, postId };
}

function refreshForumThread(boardSlug: string, topicSlug: string) {
  revalidatePath("/");
  revalidatePath("/forum");
  revalidatePath(`/forum/${boardSlug}`);
  revalidatePath(`/forum/${boardSlug}/sujet/${topicSlug}`);
}

export async function createForumTopic(formData: FormData) {
  const boardSlug = safeSlug(readField(formData, "board_slug"));
  const title = readField(formData, "title");
  const content = readField(formData, "content");
  const topicType = readField(formData, "topic_type").slice(0, 32) || "discussion";
  const rpLocation = readField(formData, "rp_location").slice(0, 120);
  const characterId = optionalUuid(readField(formData, "character_id"));
  const tags = readTags(readField(formData, "tags"));

  if (!boardSlug) redirect("/forum");
  if (!title || title.length > 120 || content.length < 2 || content.length > 50000) {
    redirect(`/forum/${boardSlug}/nouveau?erreur=champs`);
  }

  const { supabase, userId, role } = await getAuthenticatedUser();
  if (!userId) {
    redirect(`/connexion?message=connexion-requise&retour=${encodeURIComponent(`/forum/${boardSlug}/nouveau`)}`);
  }

  const participation = await getMemberParticipation(supabase, userId);
  if (!participation.canParticipate) {
    redirect(`/forum/${boardSlug}/nouveau?erreur=suspendu`);
  }

  const { data: board } = await supabase
    .from("forum_boards")
    .select("id, topic_creation")
    .eq("slug", boardSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (!board) redirect(`/forum/${boardSlug}/nouveau?erreur=publication`);
  if (!canUseForumWritePolicy(board.topic_creation, userId, role, participation.canParticipate)) {
    redirect(`/forum/${boardSlug}/nouveau?erreur=${policyError(board.topic_creation)}`);
  }

  const topicSlug = `${slugify(title)}-${randomUUID().slice(0, 8)}`;
  const { data, error } = await supabase.rpc("create_forum_topic", {
    p_board_slug: boardSlug,
    p_character_id: characterId,
    p_content: content,
    p_rp_location: rpLocation || null,
    p_slug: topicSlug,
    p_tags: tags,
    p_title: title,
    p_topic_type: topicType,
  });

  const created = Array.isArray(data) ? data[0] : null;
  if (error || !created?.topic_slug) {
    redirect(`/forum/${boardSlug}/nouveau?erreur=publication`);
  }

  revalidatePath("/forum");
  revalidatePath(`/forum/${boardSlug}`);
  redirect(`/forum/${boardSlug}/sujet/${created.topic_slug}`);
}

export async function createForumPost(formData: FormData) {
  const boardSlug = safeSlug(readField(formData, "board_slug"));
  const topicSlug = safeSlug(readField(formData, "topic_slug"));
  const topicId = readField(formData, "topic_id");
  const content = readField(formData, "content");
  const characterId = optionalUuid(readField(formData, "character_id"));

  if (!boardSlug || !topicSlug || !uuidPattern.test(topicId)) redirect("/forum");
  if (content.length < 2 || content.length > 50000) {
    redirect(`/forum/${boardSlug}/sujet/${topicSlug}?erreur=reponse#repondre`);
  }

  const { supabase, userId, role } = await getAuthenticatedUser();
  if (!userId) {
    redirect(`/connexion?message=connexion-requise&retour=${encodeURIComponent(`/forum/${boardSlug}/sujet/${topicSlug}#repondre`)}`);
  }

  const participation = await getMemberParticipation(supabase, userId);
  if (!participation.canParticipate) {
    redirect(`/forum/${boardSlug}/sujet/${topicSlug}?erreur=suspendu#repondre`);
  }

  const { data: board } = await supabase
    .from("forum_boards")
    .select("id, reply_policy")
    .eq("slug", boardSlug)
    .eq("is_active", true)
    .maybeSingle();
  if (!board) redirect(`/forum/${boardSlug}/sujet/${topicSlug}?erreur=publication#repondre`);

  if (!canUseForumWritePolicy(board.reply_policy, userId, role, participation.canParticipate)) {
    redirect(`/forum/${boardSlug}/sujet/${topicSlug}?erreur=${policyError(board.reply_policy)}#repondre`);
  }

  const { data: topic } = await supabase
    .from("forum_topics")
    .select("id, status, is_locked")
    .eq("id", topicId)
    .eq("board_id", board.id)
    .eq("slug", topicSlug)
    .maybeSingle();
  if (!topic || topic.status !== "open" || topic.is_locked) {
    redirect(`/forum/${boardSlug}/sujet/${topicSlug}?erreur=fermee#repondre`);
  }

  const { data: postId, error } = await supabase.rpc("create_forum_post", {
    p_character_id: characterId,
    p_content: content,
    p_topic_id: topicId,
  });

  if (error || typeof postId !== "string") {
    redirect(`/forum/${boardSlug}/sujet/${topicSlug}?erreur=publication#repondre`);
  }

  refreshForumThread(boardSlug, topicSlug);
  redirect(`/forum/${boardSlug}/sujet/${topicSlug}#${postId}`);
}

export async function editForumPost(formData: FormData) {
  const { boardSlug, topicSlug, topicId, postId } = safeThreadTarget(formData);
  const content = readField(formData, "content");
  if (!postId || content.length < 2 || content.length > 50000) {
    redirect(`/forum/${boardSlug}/sujet/${topicSlug}?erreur=edition-champs#${postId || "forum-thread-top"}`);
  }

  const { supabase, userId } = await getAuthenticatedUser();
  if (!userId) {
    redirect(`/connexion?message=connexion-requise&retour=${encodeURIComponent(`/forum/${boardSlug}/sujet/${topicSlug}#${postId}`)}`);
  }

  const participation = await getMemberParticipation(supabase, userId);
  if (!participation.canParticipate) {
    redirect(`/forum/${boardSlug}/sujet/${topicSlug}?erreur=edition-suspendue#${postId}`);
  }

  const [{ data: topic }, { data: post }] = await Promise.all([
    supabase
      .from("forum_topics")
      .select("id, status, is_locked")
      .eq("id", topicId)
      .eq("slug", topicSlug)
      .maybeSingle(),
    supabase
      .from("forum_posts")
      .select("id, author_id, is_hidden")
      .eq("id", postId)
      .eq("topic_id", topicId)
      .maybeSingle(),
  ]);

  if (!topic || !post || post.author_id !== userId) {
    redirect(`/forum/${boardSlug}/sujet/${topicSlug}?erreur=edition-droits#${postId}`);
  }
  if (post.is_hidden || topic.status !== "open" || topic.is_locked) {
    redirect(`/forum/${boardSlug}/sujet/${topicSlug}?erreur=edition-fermee#${postId}`);
  }

  const { data: firstPost } = await supabase
    .from("forum_posts")
    .select("id")
    .eq("topic_id", topicId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { error: postError } = await supabase
    .from("forum_posts")
    .update({ content })
    .eq("id", postId)
    .eq("author_id", userId);

  if (postError) {
    redirect(`/forum/${boardSlug}/sujet/${topicSlug}?erreur=edition#${postId}`);
  }

  if (firstPost?.id === postId) {
    const excerpt = content.replace(/\s+/g, " ").trim().slice(0, 240);
    const { error: topicError } = await supabase
      .from("forum_topics")
      .update({ excerpt })
      .eq("id", topicId)
      .eq("author_id", userId);
    if (topicError) {
      redirect(`/forum/${boardSlug}/sujet/${topicSlug}?erreur=edition#${postId}`);
    }
  }

  refreshForumThread(boardSlug, topicSlug);
  redirect(`/forum/${boardSlug}/sujet/${topicSlug}?message=message-modifie#${postId}`);
}

function deleteErrorCode(message: string, target: "post" | "topic") {
  if (message.includes("under_review")) return "suppression-signalement";
  if (message.includes("topic_closed")) return "suppression-fermee";
  if (message.includes("topic_has_replies")) return "sujet-reponses";
  if (message.includes("first_post_requires_topic_delete")) return "suppression-sujet";
  if (message.includes("owner_required")) return "suppression-droits";
  return target === "topic" ? "suppression-sujet" : "suppression-message";
}

export async function deleteForumPost(formData: FormData) {
  const { boardSlug, topicSlug, postId } = safeThreadTarget(formData);
  if (!postId) redirect("/forum");

  const { supabase, userId } = await getAuthenticatedUser();
  if (!userId) {
    redirect(`/connexion?message=connexion-requise&retour=${encodeURIComponent(`/forum/${boardSlug}/sujet/${topicSlug}`)}`);
  }

  const { error } = await supabase.rpc("delete_own_forum_post", { p_post_id: postId });
  if (error) {
    redirect(`/forum/${boardSlug}/sujet/${topicSlug}?erreur=${deleteErrorCode(error.message, "post")}#${postId}`);
  }

  refreshForumThread(boardSlug, topicSlug);
  redirect(`/forum/${boardSlug}/sujet/${topicSlug}?message=message-supprime`);
}

export async function deleteForumTopic(formData: FormData) {
  const { boardSlug, topicSlug, topicId } = safeThreadTarget(formData);

  const { supabase, userId } = await getAuthenticatedUser();
  if (!userId) {
    redirect(`/connexion?message=connexion-requise&retour=${encodeURIComponent(`/forum/${boardSlug}/sujet/${topicSlug}`)}`);
  }

  const { error } = await supabase.rpc("delete_own_forum_topic", { p_topic_id: topicId });
  if (error) {
    redirect(`/forum/${boardSlug}/sujet/${topicSlug}?erreur=${deleteErrorCode(error.message, "topic")}#forum-thread-top`);
  }

  revalidatePath("/");
  revalidatePath("/forum");
  revalidatePath(`/forum/${boardSlug}`);
  redirect(`/forum/${boardSlug}`);
}

export async function markTopicRead(topicId: string, lastPostId: string | null) {
  if (!uuidPattern.test(topicId)) return { ok: false };
  if (lastPostId && !uuidPattern.test(lastPostId)) return { ok: false };

  const { supabase, userId } = await getAuthenticatedUser();
  if (!userId) return { ok: false };

  const { error } = await supabase
    .from("forum_topic_reads")
    .upsert(
      {
        topic_id: topicId,
        user_id: userId,
        last_read_post_id: lastPostId,
        last_read_at: new Date().toISOString(),
      },
      { onConflict: "topic_id,user_id" },
    );

  return { ok: !error };
}

export async function setTopicFollow(topicId: string, shouldFollow: boolean) {
  if (!uuidPattern.test(topicId)) return { ok: false, following: false };

  const { supabase, userId } = await getAuthenticatedUser();
  if (!userId) return { ok: false, following: false };

  if (shouldFollow) {
    const { error } = await supabase
      .from("forum_topic_follows")
      .upsert({ topic_id: topicId, user_id: userId }, { onConflict: "topic_id,user_id" });
    return { ok: !error, following: !error };
  }

  const { error } = await supabase
    .from("forum_topic_follows")
    .delete()
    .eq("topic_id", topicId)
    .eq("user_id", userId);

  return { ok: !error, following: error ? true : false };
}

export async function moderateForumTopic(
  topicId: string,
  boardSlugValue: string,
  topicSlugValue: string,
  action: ForumModerationAction,
) {
  const boardSlug = safeSlug(boardSlugValue);
  const topicSlug = safeSlug(topicSlugValue);
  if (!uuidPattern.test(topicId) || !boardSlug || !topicSlug) {
    return { ok: false as const, error: "invalid" as const };
  }

  const { supabase, userId, role } = await getAuthenticatedUser();
  if (!userId || (role !== "admin" && role !== "moderator")) {
    return { ok: false as const, error: "forbidden" as const };
  }

  const update: { is_pinned?: boolean; is_locked?: boolean; status?: string } = {};
  switch (action) {
    case "pin":
      update.is_pinned = true;
      break;
    case "unpin":
      update.is_pinned = false;
      break;
    case "lock":
      update.is_locked = true;
      break;
    case "unlock":
      update.is_locked = false;
      break;
    case "finish":
      update.status = "finished";
      break;
    case "archive":
      update.status = "archived";
      update.is_locked = true;
      break;
    case "reopen":
      update.status = "open";
      update.is_locked = false;
      break;
    default:
      return { ok: false as const, error: "invalid" as const };
  }

  const { data, error } = await supabase
    .from("forum_topics")
    .update(update)
    .eq("id", topicId)
    .select("is_pinned, is_locked, status")
    .single();

  if (error || !data) return { ok: false as const, error: "update" as const };

  revalidatePath("/forum");
  revalidatePath(`/forum/${boardSlug}`);
  revalidatePath(`/forum/${boardSlug}/sujet/${topicSlug}`);

  return {
    ok: true as const,
    pinned: Boolean(data.is_pinned),
    locked: Boolean(data.is_locked),
    status: String(data.status),
  };
}
