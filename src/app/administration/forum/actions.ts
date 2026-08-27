"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TOPIC_ACTIONS = new Set(["pin", "unpin", "lock", "unlock", "finish", "archive", "reopen"]);
const REPORT_STATUSES = new Set(["open", "in_review", "resolved", "dismissed"]);

function getRole(appMetadata: unknown) {
  if (!appMetadata || typeof appMetadata !== "object" || !("role" in appMetadata)) return "member";
  return String((appMetadata as { role?: unknown }).role ?? "member");
}

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
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

async function requireStaff() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const role = getRole(claims?.app_metadata);

  if (error || !claims || typeof claims.sub !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fadministration%2Fforum");
  }
  if (role !== "admin" && role !== "moderator") redirect("/compte");

  return { supabase, userId: claims.sub, role };
}

function refreshModeration() {
  revalidatePath("/administration/forum");
  revalidatePath("/forum");
}

export async function moderateTopicFromAdmin(formData: FormData) {
  const topicId = field(formData, "topic_id");
  const action = field(formData, "action");
  const returnTo = safeReturnTo(formData);

  if (!UUID_PATTERN.test(topicId) || !TOPIC_ACTIONS.has(action)) {
    redirectWith(returnTo, "erreur", "donnees");
  }

  const { supabase } = await requireStaff();
  const update: { is_pinned?: boolean; is_locked?: boolean; status?: string } = {};

  if (action === "pin") update.is_pinned = true;
  if (action === "unpin") update.is_pinned = false;
  if (action === "lock") update.is_locked = true;
  if (action === "unlock") update.is_locked = false;
  if (action === "finish") update.status = "finished";
  if (action === "archive") {
    update.status = "archived";
    update.is_locked = true;
  }
  if (action === "reopen") {
    update.status = "open";
    update.is_locked = false;
  }

  const { error } = await supabase.from("forum_topics").update(update).eq("id", topicId);
  if (error) redirectWith(returnTo, "erreur", "moderation");

  refreshModeration();
  redirectWith(returnTo, "message", "sujet");
}

export async function moveTopicFromAdmin(formData: FormData) {
  const topicId = field(formData, "topic_id");
  const boardId = field(formData, "board_id");
  const returnTo = safeReturnTo(formData);

  if (!UUID_PATTERN.test(topicId) || !UUID_PATTERN.test(boardId)) {
    redirectWith(returnTo, "erreur", "donnees");
  }

  const { supabase } = await requireStaff();
  const { error } = await supabase.from("forum_topics").update({ board_id: boardId }).eq("id", topicId);
  if (error) redirectWith(returnTo, "erreur", "deplacement");

  refreshModeration();
  redirectWith(returnTo, "message", "deplace");
}

export async function setPostVisibilityFromAdmin(formData: FormData) {
  const postId = field(formData, "post_id");
  const hidden = field(formData, "hidden") === "true";
  const returnTo = safeReturnTo(formData);

  if (!UUID_PATTERN.test(postId)) redirectWith(returnTo, "erreur", "donnees");

  const { supabase, userId } = await requireStaff();
  const { error } = await supabase
    .from("forum_posts")
    .update({
      is_hidden: hidden,
      hidden_at: hidden ? new Date().toISOString() : null,
      hidden_by: hidden ? userId : null,
    })
    .eq("id", postId);

  if (error) redirectWith(returnTo, "erreur", "message");

  refreshModeration();
  redirectWith(returnTo, "message", hidden ? "masque" : "restaure");
}

export async function updateReportFromAdmin(formData: FormData) {
  const reportId = field(formData, "report_id");
  const status = field(formData, "status");
  const note = field(formData, "resolution_note");
  const returnTo = safeReturnTo(formData);

  if (!UUID_PATTERN.test(reportId) || !REPORT_STATUSES.has(status) || note.length > 2000) {
    redirectWith(returnTo, "erreur", "signalement");
  }

  const { supabase, userId } = await requireStaff();
  const closed = status === "resolved" || status === "dismissed";
  const update = {
    status,
    handled_by: status === "open" ? null : userId,
    resolution_note: closed ? note : "",
    resolved_at: closed ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("forum_reports").update(update).eq("id", reportId);
  if (error) redirectWith(returnTo, "erreur", "signalement");

  refreshModeration();
  redirectWith(returnTo, "message", "signalement");
}
