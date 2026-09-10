"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function requireUser(returnTo: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || typeof userId !== "string") {
    redirect(`/connexion?message=connexion-requise&retour=${encodeURIComponent(returnTo)}`);
  }

  return { supabase, userId };
}

function refreshCharacterPaths(slug: string) {
  revalidatePath("/personnages");
  revalidatePath(`/personnages/${slug}`);
  revalidatePath(`/personnages/${slug}/modifier`);
  revalidatePath("/liens");
  revalidatePath("/compte");
  revalidatePath("/administration");
  revalidatePath("/administration/personnages");
}

function readCharacterId(formData: FormData) {
  const characterId = String(formData.get("character_id") ?? "");
  return UUID_PATTERN.test(characterId) ? characterId : null;
}

export async function removeCharacterPortrait(formData: FormData) {
  const characterId = readCharacterId(formData);
  const currentSlug = String(formData.get("current_slug") ?? "").slice(0, 90);
  const returnTo = currentSlug ? `/personnages/${currentSlug}/modifier` : "/personnages";
  if (!characterId) redirect(returnTo);

  const { supabase, userId } = await requireUser(returnTo);
  const { data: character } = await supabase
    .from("characters")
    .select("id, slug, portrait_path")
    .eq("id", characterId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (!character) redirect("/personnages");
  if (!character.portrait_path) redirect(`/personnages/${character.slug}/modifier`);

  const portraitPath = character.portrait_path;
  const { data: updated, error: updateError } = await supabase
    .from("characters")
    .update({ portrait_path: null })
    .eq("id", character.id)
    .eq("owner_id", userId)
    .select("id")
    .maybeSingle();

  if (updateError || !updated) {
    redirect(`/personnages/${character.slug}/modifier?erreur=portrait`);
  }

  await supabase.storage.from("character-portraits").remove([portraitPath]);
  refreshCharacterPaths(character.slug);
  redirect(`/personnages/${character.slug}/modifier?message=portrait-supprime`);
}

export async function deleteCharacter(formData: FormData) {
  const characterId = readCharacterId(formData);
  const currentSlug = String(formData.get("current_slug") ?? "").slice(0, 90);
  const returnTo = currentSlug ? `/personnages/${currentSlug}/modifier` : "/personnages";
  if (!characterId) redirect(returnTo);

  const { supabase, userId } = await requireUser(returnTo);
  const { data: character } = await supabase
    .from("characters")
    .select("id, slug, portrait_path")
    .eq("id", characterId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (!character) redirect("/personnages");

  const { data: deleted, error: deleteError } = await supabase
    .from("characters")
    .delete()
    .eq("id", character.id)
    .eq("owner_id", userId)
    .select("id")
    .maybeSingle();

  if (deleteError || !deleted) {
    redirect(`/personnages/${character.slug}/modifier?erreur=suppression`);
  }

  if (character.portrait_path) {
    await supabase.storage.from("character-portraits").remove([character.portrait_path]);
  }

  refreshCharacterPaths(character.slug);
  redirect("/personnages?message=personnage-supprime");
}
