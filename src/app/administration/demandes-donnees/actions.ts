"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const allowedStatuses = new Set(["new", "in_progress", "resolved", "rejected"]);

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getRole(appMetadata: unknown) {
  if (!appMetadata || typeof appMetadata !== "object" || !("role" in appMetadata)) return "member";
  return String((appMetadata as { role?: unknown }).role ?? "member");
}

export async function updatePrivacyRequest(formData: FormData) {
  const id = field(formData, "id");
  const status = field(formData, "status");
  const adminNote = field(formData, "admin_note");

  if (!/^[0-9a-f-]{36}$/i.test(id) || !allowedStatuses.has(status) || adminNote.length > 4000) {
    redirect("/administration/demandes-donnees?erreur=validation");
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (claimsError || !claims || typeof claims.sub !== "string") redirect("/connexion?message=connexion-requise&retour=%2Fadministration%2Fdemandes-donnees");
  if (getRole(claims.app_metadata) !== "admin") redirect("/compte");

  const closed = status === "resolved" || status === "rejected";
  const { error } = await supabase
    .from("privacy_requests")
    .update({
      status,
      admin_note: adminNote || null,
      handled_at: closed ? new Date().toISOString() : null,
      handled_by: closed ? claims.sub : null,
    })
    .eq("id", id);

  if (error) redirect("/administration/demandes-donnees?erreur=enregistrement");

  revalidatePath("/administration/demandes-donnees");
  redirect("/administration/demandes-donnees?message=enregistre");
}
