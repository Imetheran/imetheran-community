"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function updateProfile(formData: FormData) {
  const displayName = field(formData, "display_name");
  const usernameInput = field(formData, "username").toLowerCase();
  const bio = field(formData, "bio");

  if (!displayName || displayName.length > 64) {
    redirect("/compte?erreur=nom");
  }

  if (usernameInput && !/^[a-z0-9][a-z0-9_-]{1,30}[a-z0-9]$/.test(usernameInput)) {
    redirect("/compte?erreur=identifiant");
  }

  if (bio.length > 1200) {
    redirect("/compte?erreur=bio");
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string") {
    redirect("/connexion?message=connexion-requise");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      username: usernameInput || null,
      bio,
    })
    .eq("id", userId);

  if (error) {
    if (error.code === "23505") redirect("/compte?erreur=identifiant-pris");
    redirect("/compte?erreur=enregistrement");
  }

  revalidatePath("/compte");
  revalidatePath("/", "layout");
  redirect("/compte?message=enregistre");
}
