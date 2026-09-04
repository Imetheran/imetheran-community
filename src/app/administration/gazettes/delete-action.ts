"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppRole } from "@/lib/gazettes";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const GAZETTE_COVER_BUCKET = "gazette-covers";

async function requireAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims || typeof claims.sub !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fadministration%2Fgazettes");
  }

  if (getAppRole(claims.app_metadata) !== "admin") redirect("/compte");
  return supabase;
}

export async function deleteGazette(formData: FormData) {
  const gazetteId = String(formData.get("gazette_id") ?? "");
  if (!UUID_PATTERN.test(gazetteId)) redirect("/administration/gazettes?erreur=suppression");

  const supabase = await requireAdmin();
  const { data: gazette } = await supabase
    .from("gazettes")
    .select("slug")
    .eq("id", gazetteId)
    .maybeSingle();

  if (!gazette) redirect("/administration/gazettes?erreur=introuvable");

  const { error: coverError } = await supabase.storage
    .from(GAZETTE_COVER_BUCKET)
    .remove([`${gazetteId}/cover`]);

  if (coverError) redirect("/administration/gazettes?erreur=suppression-couverture");

  const { error } = await supabase.from("gazettes").delete().eq("id", gazetteId);
  if (error) redirect("/administration/gazettes?erreur=suppression");

  revalidatePath("/");
  revalidatePath("/gazettes");
  revalidatePath(`/gazettes/${gazette.slug}`);
  revalidatePath("/administration");
  revalidatePath("/administration/gazettes");
  redirect("/administration/gazettes?message=supprimee");
}
