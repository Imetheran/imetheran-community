"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getRole(appMetadata: unknown) {
  if (!appMetadata || typeof appMetadata !== "object" || !("role" in appMetadata)) return "member";
  return String((appMetadata as { role?: unknown }).role ?? "member");
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims || typeof claims.sub !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fadministration%2Fliens");
  }
  if (getRole(claims.app_metadata) !== "admin") redirect("/compte");
  return { supabase, userId: claims.sub };
}

export async function moderateRelationship(formData: FormData) {
  const relationshipId = String(formData.get("relationship_id") ?? "");
  const action = String(formData.get("action") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 1000);
  if (!UUID_PATTERN.test(relationshipId) || (action !== "hide" && action !== "restore")) {
    redirect("/administration/liens?erreur=donnees");
  }
  if (action === "hide" && reason.length < 3) redirect("/administration/liens?erreur=motif");

  const { supabase, userId } = await requireAdmin();
  const update = action === "hide"
    ? { is_moderation_hidden: true, moderation_note: reason, moderated_at: new Date().toISOString(), moderated_by: userId }
    : { is_moderation_hidden: false, moderation_note: "", moderated_at: new Date().toISOString(), moderated_by: userId };
  const { error } = await supabase.from("character_relationships").update(update).eq("id", relationshipId);
  if (error) redirect("/administration/liens?erreur=enregistrement");

  revalidatePath("/liens");
  revalidatePath("/personnages/[slug]", "page");
  revalidatePath("/administration/liens");
  redirect(`/administration/liens?message=${action}`);
}
