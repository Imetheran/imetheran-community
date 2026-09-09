"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function markAllForumRead() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Factivite");
  }

  const { data: topics, error: topicError } = await supabase
    .from("forum_topics")
    .select("id, last_post_id");

  if (topicError) redirect("/activite?erreur=lecture");

  const rows = (topics ?? []).map((topic) => ({
    user_id: userId,
    topic_id: topic.id,
    last_read_post_id: topic.last_post_id,
    last_read_at: new Date().toISOString(),
  }));

  if (rows.length > 0) {
    const { error } = await supabase
      .from("forum_topic_reads")
      .upsert(rows, { onConflict: "topic_id,user_id" });
    if (error) redirect("/activite?erreur=lecture");
  }

  revalidatePath("/activite");
  revalidatePath("/forum");
  redirect("/activite?message=lus");
}
