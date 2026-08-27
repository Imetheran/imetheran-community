"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KINDS = new Set(["trust", "friendship", "rivalry", "debt", "family", "romance", "unknown"]);
const VISIBILITIES = new Set(["public", "unlisted", "private"]);
const DECISIONS = new Set(["approve", "reject", "revision"]);

async function requireMember() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || typeof userId !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fliens");
  }
  return { supabase, userId };
}

function refreshLinks() {
  revalidatePath("/liens");
  revalidatePath("/personnages");
  revalidatePath("/personnages/[slug]", "page");
  revalidatePath("/administration/liens");
  revalidatePath("/administration");
}

function readFields(formData: FormData) {
  const sourceCharacterId = String(formData.get("source_character_id") ?? "");
  const targetCharacterId = String(formData.get("target_character_id") ?? "");
  const kind = String(formData.get("kind") ?? "unknown");
  const label = String(formData.get("label") ?? "").trim().slice(0, 120);
  const description = String(formData.get("description") ?? "").trim().slice(0, 3000);
  const visibilityValue = String(formData.get("visibility") ?? "public");
  const intensity = Math.min(3, Math.max(1, Number(formData.get("intensity") ?? 1) || 1));
  return {
    sourceCharacterId,
    targetCharacterId,
    kind: KINDS.has(kind) ? kind : "unknown",
    label,
    description,
    visibility: VISIBILITIES.has(visibilityValue) ? visibilityValue : "public",
    intensity,
  };
}

function relationError(error: { code?: string; message?: string } | null) {
  if (error?.code === "23505") return "doublon";
  const message = error?.message ?? "";
  if (message.includes("counterpart_not_public")) return "cible";
  if (message.includes("participation_suspended")) return "suspendu";
  if (message.includes("owner_required")) return "droits";
  return "enregistrement";
}

export async function createCharacterRelationship(formData: FormData) {
  const fields = readFields(formData);
  if (!UUID_PATTERN.test(fields.sourceCharacterId) || !UUID_PATTERN.test(fields.targetCharacterId) || fields.sourceCharacterId === fields.targetCharacterId || !fields.label) {
    redirect("/liens?erreur=champs");
  }

  const { supabase, userId } = await requireMember();
  const { data: source } = await supabase
    .from("characters")
    .select("id, owner_id")
    .eq("id", fields.sourceCharacterId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (!source) redirect("/liens?erreur=droits");

  const { data, error } = await supabase
    .from("character_relationships")
    .insert({
      source_character_id: fields.sourceCharacterId,
      target_character_id: fields.targetCharacterId,
      kind: fields.kind,
      label: fields.label,
      description: fields.description,
      intensity: fields.intensity,
      visibility: fields.visibility,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error || !data) redirect(`/liens?erreur=${relationError(error)}`);
  refreshLinks();
  redirect("/liens?message=proposition");
}

export async function respondCharacterRelationship(formData: FormData) {
  const relationshipId = String(formData.get("relationship_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000);
  if (!UUID_PATTERN.test(relationshipId) || !DECISIONS.has(decision)) redirect("/liens?erreur=champs");
  if ((decision === "reject" || decision === "revision") && note.length < 3) redirect("/liens?erreur=note");

  const { supabase } = await requireMember();
  const { error } = await supabase.rpc("respond_character_relationship", {
    p_relationship_id: relationshipId,
    p_decision: decision,
    p_note: note,
  });
  if (error) redirect(`/liens?erreur=${relationError(error)}`);
  refreshLinks();
  redirect(`/liens?message=${decision}`);
}

export async function reviseCharacterRelationship(formData: FormData) {
  const relationshipId = String(formData.get("relationship_id") ?? "");
  const fields = readFields(formData);
  if (!UUID_PATTERN.test(relationshipId) || !fields.label) redirect("/liens?erreur=champs");

  const { supabase } = await requireMember();
  const { data: existing } = await supabase
    .from("character_relationships")
    .select("id")
    .eq("id", relationshipId)
    .maybeSingle();
  if (!existing) redirect("/liens?erreur=introuvable");

  const { error } = await supabase
    .from("character_relationships")
    .update({
      kind: fields.kind,
      label: fields.label,
      description: fields.description,
      intensity: fields.intensity,
      visibility: fields.visibility,
    })
    .eq("id", relationshipId);
  if (error) redirect(`/liens?erreur=${relationError(error)}`);

  refreshLinks();
  redirect("/liens?message=revision");
}

export async function withdrawCharacterRelationship(formData: FormData) {
  const relationshipId = String(formData.get("relationship_id") ?? "");
  if (!UUID_PATTERN.test(relationshipId)) redirect("/liens?erreur=champs");
  const { supabase } = await requireMember();
  const { error } = await supabase.from("character_relationships").delete().eq("id", relationshipId);
  if (error) redirect(`/liens?erreur=${relationError(error)}`);
  refreshLinks();
  redirect("/liens?message=retire");
}
