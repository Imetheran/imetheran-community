"use client";

import { createClient } from "@/lib/supabase/client";

async function currentUserId() {
  const supabase = createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  return typeof userId === "string" ? { supabase, userId } : null;
}

export async function loadForumDraft<T>(draftKey: string): Promise<T | null> {
  const session = await currentUserId();
  if (!session) return null;

  const { data, error } = await session.supabase
    .from("forum_drafts")
    .select("payload")
    .eq("user_id", session.userId)
    .eq("draft_key", draftKey)
    .maybeSingle();

  if (error || !data?.payload || typeof data.payload !== "object") return null;
  return data.payload as T;
}

export async function saveForumDraft(draftKey: string, payload: Record<string, unknown>) {
  const session = await currentUserId();
  if (!session) return false;

  const { error } = await session.supabase
    .from("forum_drafts")
    .upsert({
      user_id: session.userId,
      draft_key: draftKey,
      payload,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,draft_key" });

  return !error;
}

export async function deleteForumDraft(draftKey: string) {
  const session = await currentUserId();
  if (!session) return false;

  const { error } = await session.supabase
    .from("forum_drafts")
    .delete()
    .eq("user_id", session.userId)
    .eq("draft_key", draftKey);

  return !error;
}
