"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIONS = new Set(["feature", "unfeature", "hide", "restore", "publish", "archive"]);

function getRole(appMetadata: unknown) {
  if (!appMetadata || typeof appMetadata !== "object" || !("role" in appMetadata)) return "member";
  return String((appMetadata as { role?: unknown }).role ?? "member");
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims || typeof claims.sub !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fadministration%2Fpersonnages");
  }
  if (getRole(claims.app_metadata) !== "admin") redirect("/compte");
  return { supabase, userId: claims.sub };
}

function refresh(slug?: string) {
  revalidatePath("/administration");
  revalidatePath("/administration/personnages");
  revalidatePath("/personnages");
  if (slug) revalidatePath(`/personnages/${slug}`);
}

export async function moderateCharacter(formData: FormData) {
  const characterId = String(formData.get("character_id") ?? "");
  const action = String(formData.get("action") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 1000);

  if (!UUID_PATTERN.test(characterId) || !ACTIONS.has(action)) {
    redirect("/administration/personnages?erreur=donnees");
  }
  if (action === "hide" && reason.length < 3) {
    redirect("/administration/personnages?erreur=motif");
  }

  const { supabase, userId } = await requireAdmin();
  const { data: character } = await supabase
    .from("characters")
    .select("id, slug, is_featured, is_moderation_hidden, status")
    .eq("id", characterId)
    .maybeSingle();
  if (!character) redirect("/administration/personnages?erreur=introuvable");

  const update: Record<string, unknown> = {};
  if (action === "feature") update.is_featured = true;
  if (action === "unfeature") update.is_featured = false;
  if (action === "hide") {
    update.is_moderation_hidden = true;
    update.moderation_note = reason;
    update.moderated_at = new Date().toISOString();
    update.moderated_by = userId;
    update.is_featured = false;
  }
  if (action === "restore") {
    update.is_moderation_hidden = false;
    update.moderation_note = "";
    update.moderated_at = new Date().toISOString();
    update.moderated_by = userId;
  }
  if (action === "publish") update.status = "published";
  if (action === "archive") {
    update.status = "archived";
    update.is_featured = false;
  }

  const { error } = await supabase.from("characters").update(update).eq("id", characterId);
  if (error) redirect("/administration/personnages?erreur=enregistrement");

  refresh(character.slug);
  redirect(`/administration/personnages?message=${action}`);
}
