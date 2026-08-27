"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG_PATTERN = /^[a-z0-9-]+$/;
const REPORT_REASONS = new Set(["spam", "harassment", "inappropriate", "spoiler", "other"]);

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function threadUrl(boardSlug: string, topicSlug: string, query: string, postId: string | null) {
  return `/forum/${boardSlug}/sujet/${topicSlug}?${query}${postId ? `#${postId}` : ""}`;
}

export async function reportForumContent(formData: FormData) {
  const boardSlug = field(formData, "board_slug");
  const topicSlug = field(formData, "topic_slug");
  const topicId = field(formData, "topic_id");
  const rawPostId = field(formData, "post_id");
  const postId = rawPostId ? rawPostId : null;
  const reason = field(formData, "reason");
  const details = field(formData, "details");

  if (
    !SLUG_PATTERN.test(boardSlug)
    || !SLUG_PATTERN.test(topicSlug)
    || !UUID_PATTERN.test(topicId)
    || (postId !== null && !UUID_PATTERN.test(postId))
    || !REPORT_REASONS.has(reason)
    || details.length > 2000
  ) {
    redirect(threadUrl(boardSlug || "forum", topicSlug || "sujet", "erreur=signalement", postId));
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string") {
    const returnTo = `/forum/${boardSlug}/sujet/${topicSlug}${postId ? `#${postId}` : ""}`;
    redirect(`/connexion?message=connexion-requise&retour=${encodeURIComponent(returnTo)}`);
  }

  const { error } = await supabase.from("forum_reports").insert({
    reporter_id: userId,
    topic_id: topicId,
    post_id: postId,
    reason,
    details,
  });

  if (error) {
    const code = error.code === "23505" ? "signalement-deja" : "signalement";
    redirect(threadUrl(boardSlug, topicSlug, `erreur=${code}`, postId));
  }

  redirect(threadUrl(boardSlug, topicSlug, "message=signalement", postId));
}
