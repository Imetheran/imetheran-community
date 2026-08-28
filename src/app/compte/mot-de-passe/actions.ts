"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function readField(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function updatePassword(formData: FormData) {
  const password = readField(formData, "password");
  const confirmation = readField(formData, "password_confirmation");

  if (password.length < 10) redirect("/compte/mot-de-passe?erreur=longueur");
  if (password !== confirmation) redirect("/compte/mot-de-passe?erreur=confirmation");

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (claimsError || !claims || typeof claims.sub !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fcompte%2Fmot-de-passe");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect("/compte/mot-de-passe?erreur=enregistrement");

  revalidatePath("/", "layout");
  redirect("/compte?message=mot-de-passe");
}
