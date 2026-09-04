"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STORAGE_BATCH_SIZE = 100;

type DeleteManifest = {
  character_portraits?: unknown;
  forum_media?: unknown;
};

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

  if (getRole(claims.app_metadata) !== "admin") redirect("/compte");
  return { supabase, userId: claims.sub };
}

function mapDeleteError(error: { message?: string } | null) {
  const message = error?.message ?? "";
  if (message.includes("cannot_delete_self")) return "auto-suppression-compte";
  if (message.includes("cannot_delete_last_admin")) return "dernier-admin-suppression";
  if (message.includes("member_not_found")) return "membre-introuvable";
  if (message.includes("admin_required")) return "droits";
  return "suppression";
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

async function removeStoredFiles(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bucket: string,
  paths: string[],
) {
  for (let index = 0; index < paths.length; index += STORAGE_BATCH_SIZE) {
    const { error } = await supabase.storage.from(bucket).remove(paths.slice(index, index + STORAGE_BATCH_SIZE));
    if (error) return false;
  }
  return true;
}

function refreshAdministration() {
  revalidatePath("/");
  revalidatePath("/forum");
  revalidatePath("/personnages");
  revalidatePath("/liens");
  revalidatePath("/chroniques");
  revalidatePath("/gazettes");
  revalidatePath("/administration");
  revalidatePath("/administration/membres");
  revalidatePath("/administration/personnages");
}

export async function deleteMember(formData: FormData) {
  const memberId = String(formData.get("user_id") ?? "");
  if (!UUID_PATTERN.test(memberId)) redirect("/administration/membres?erreur=donnees");

  const { supabase, userId } = await requireAdmin();
  if (memberId === userId) redirect("/administration/membres?erreur=auto-suppression-compte");

  const { data, error } = await supabase.rpc("admin_delete_member", { p_user_id: memberId });
  if (error) redirect(`/administration/membres?erreur=${mapDeleteError(error)}`);

  const manifest = data && typeof data === "object" ? data as DeleteManifest : {};
  const portraitPaths = stringArray(manifest.character_portraits);
  const forumMediaPaths = stringArray(manifest.forum_media);

  const [portraitsRemoved, forumMediaRemoved] = await Promise.all([
    removeStoredFiles(supabase, "character-portraits", portraitPaths),
    removeStoredFiles(supabase, "forum-media", forumMediaPaths),
  ]);

  refreshAdministration();
  redirect(`/administration/membres?message=${portraitsRemoved && forumMediaRemoved ? "supprime" : "supprime-stockage"}`);
}
