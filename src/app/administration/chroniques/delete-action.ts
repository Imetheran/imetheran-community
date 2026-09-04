"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppRole } from "@/lib/chronicles";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CHRONICLE_COVER_BUCKET = "chronicle-covers";

async function requireAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims || typeof claims.sub !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fadministration%2Fchroniques");
  }

  if (getAppRole(claims.app_metadata) !== "admin") redirect("/compte");
  return supabase;
}

export async function deleteChronicle(formData: FormData) {
  const chronicleId = String(formData.get("chronicle_id") ?? "");
  if (!UUID_PATTERN.test(chronicleId)) redirect("/administration/chroniques?erreur=suppression");

  const supabase = await requireAdmin();
  const { data: chronicle } = await supabase
    .from("chronicles")
    .select("slug")
    .eq("id", chronicleId)
    .maybeSingle();

  if (!chronicle) redirect("/administration/chroniques?erreur=introuvable");

  const { error: coverError } = await supabase.storage
    .from(CHRONICLE_COVER_BUCKET)
    .remove([`${chronicleId}/cover`]);

  if (coverError) redirect("/administration/chroniques?erreur=suppression-couverture");

  const { error } = await supabase.from("chronicles").delete().eq("id", chronicleId);
  if (error) redirect("/administration/chroniques?erreur=suppression");

  revalidatePath("/");
  revalidatePath("/chroniques");
  revalidatePath(`/chroniques/${chronicle.slug}`);
  revalidatePath("/administration");
  revalidatePath("/administration/chroniques");
  redirect("/administration/chroniques?message=supprimee");
}
