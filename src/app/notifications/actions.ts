"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || typeof userId !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fnotifications");
  }
  return { supabase, userId };
}

function safeInternalHref(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return "/notifications";
  return value.slice(0, 800);
}

function revalidateMemberNotifications() {
  revalidatePath("/notifications");
  revalidatePath("/compte");
}

export async function openNotification(formData: FormData) {
  const notificationId = String(formData.get("notification_id") ?? "").trim();
  if (!UUID_PATTERN.test(notificationId)) redirect("/notifications?erreur=notification");

  const { supabase, userId } = await requireUser();
  const { data: notification, error } = await supabase
    .from("notifications")
    .select("id, href")
    .eq("id", notificationId)
    .eq("user_id", userId)
    .single();

  if (error || !notification) redirect("/notifications?erreur=notification");

  const { error: updateError } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (updateError) redirect("/notifications?erreur=lecture");

  revalidateMemberNotifications();
  redirect(safeInternalHref(String(notification.href ?? "/notifications")));
}

export async function markNotificationRead(formData: FormData) {
  const notificationId = String(formData.get("notification_id") ?? "").trim();
  if (!UUID_PATTERN.test(notificationId)) redirect("/notifications?erreur=notification");

  const { supabase, userId } = await requireUser();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) redirect("/notifications?erreur=lecture");
  revalidateMemberNotifications();
  redirect("/notifications?message=lu");
}

export async function markAllNotificationsRead() {
  const { supabase, userId } = await requireUser();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) redirect("/notifications?erreur=lecture");
  revalidateMemberNotifications();
  redirect("/notifications?message=lus");
}

export async function deleteNotification(formData: FormData) {
  const notificationId = String(formData.get("notification_id") ?? "").trim();
  if (!UUID_PATTERN.test(notificationId)) redirect("/notifications?erreur=notification");

  const { supabase, userId } = await requireUser();
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) redirect("/notifications?erreur=suppression");
  revalidateMemberNotifications();
  redirect("/notifications?message=supprimee");
}
