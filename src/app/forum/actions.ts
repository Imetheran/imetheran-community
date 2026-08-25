"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9-]+$/;

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
        .map((tag) => tag.slice(0, 36)),
    ),
  ).slice(0, 5);
}

async function getAuthenticatedUserId() {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (error || typeof userId !== "string") return { supabase, userId: null };
  return { supabase, userId };
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

  const { supabase, userId } = await getAuthenticatedUserId();
  if (!userId) {
    redirect(`/connexion?message=connexion-requise&retour=${encodeURIComponent(`/forum/${boardSlug}/nouveau`)}`);
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

  const { supabase, userId } = await getAuthenticatedUserId();
  if (!userId) {
    redirect(`/connexion?message=connexion-requise&retour=${encodeURIComponent(`/forum/${boardSlug}/sujet/${topicSlug}#repondre`)}`);
  }

  const { data: postId, error } = await supabase.rpc("create_forum_post", {
    p_character_id: characterId,
    p_content: content,
    p_topic_id: topicId,
  });

  if (error || typeof postId !== "string") {
    redirect(`/forum/${boardSlug}/sujet/${topicSlug}?erreur=publication#repondre`);
  }

  revalidatePath("/forum");
  revalidatePath(`/forum/${boardSlug}`);
  revalidatePath(`/forum/${boardSlug}/sujet/${topicSlug}`);
  redirect(`/forum/${boardSlug}/sujet/${topicSlug}#${postId}`);
}

export async function markTopicRead(topicId: string, lastPostId: string | null) {
  if (!uuidPattern.test(topicId)) return { ok: false };
  if (lastPostId && !uuidPattern.test(lastPostId)) return { ok: false };

  const { supabase, userId } = await getAuthenticatedUserId();
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

  const { supabase, userId } = await getAuthenticatedUserId();
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
