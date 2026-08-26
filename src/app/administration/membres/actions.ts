"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ROLES = new Set(["member", "moderator", "admin"]);
const DURATIONS = new Set(["1d", "7d", "30d", "indefinite"]);

function getRole(appMetadata: unknown) {
  if (!appMetadata || typeof appMetadata !== "object" || !("role" in appMetadata)) return "member";
  return String((appMetadata as { role?: unknown }).role ?? "member");
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims || typeof claims.sub !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fadministration%2Fmembres");
  }

  if (getRole(claims.app_metadata) !== "admin") {
    redirect("/compte");
  }

  return supabase;
}

function mapError(error: { message?: string } | null) {
  const message = error?.message ?? "";
  if (message.includes("cannot_demote_last_admin")) return "dernier-admin";
  if (message.includes("cannot_suspend_self")) return "auto-suspension";
  if (message.includes("member_not_found")) return "membre-introuvable";
  if (message.includes("admin_required")) return "droits";
  return "enregistrement";
}

function getSuspensionUntil(duration: string) {
  if (duration === "indefinite") return null;
  const days = duration === "1d" ? 1 : duration === "7d" ? 7 : 30;
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

function refreshAdministration() {
  revalidatePath("/administration");
  revalidatePath("/administration/membres");
}

export async function changeMemberRole(formData: FormData) {
  const userId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!UUID_PATTERN.test(userId) || !ROLES.has(role)) {
    redirect("/administration/membres?erreur=donnees");
  }

  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("admin_set_member_role", {
    p_user_id: userId,
    p_role: role,
  });

  if (error) {
    redirect(`/administration/membres?erreur=${mapError(error)}`);
  }

  refreshAdministration();
  redirect("/administration/membres?message=role");
}

export async function suspendMember(formData: FormData) {
  const userId = String(formData.get("user_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const duration = String(formData.get("duration") ?? "7d");

  if (!UUID_PATTERN.test(userId) || !DURATIONS.has(duration) || reason.length < 3 || reason.length > 500) {
    redirect("/administration/membres?erreur=suspension");
  }

  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("admin_set_member_participation", {
    p_user_id: userId,
    p_status: "suspended",
    p_reason: reason,
    p_until: getSuspensionUntil(duration),
  });

  if (error) {
    redirect(`/administration/membres?erreur=${mapError(error)}`);
  }

  refreshAdministration();
  redirect("/administration/membres?message=suspendu");
}

export async function reactivateMember(formData: FormData) {
  const userId = String(formData.get("user_id") ?? "");

  if (!UUID_PATTERN.test(userId)) {
    redirect("/administration/membres?erreur=donnees");
  }

  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("admin_set_member_participation", {
    p_user_id: userId,
    p_status: "active",
    p_reason: null,
    p_until: null,
  });

  if (error) {
    redirect(`/administration/membres?erreur=${mapError(error)}`);
  }

  refreshAdministration();
  redirect("/administration/membres?message=reactive");
}
