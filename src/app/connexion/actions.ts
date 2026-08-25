"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://imetheran-community.vercel.app";

function readField(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function login(formData: FormData) {
  const email = readField(formData, "email").toLowerCase();
  const password = readField(formData, "password");

  if (!email || !password) redirect("/connexion?erreur=champs");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) redirect("/connexion?erreur=identifiants");

  revalidatePath("/", "layout");
  redirect("/compte");
}

export async function signup(formData: FormData) {
  const displayName = readField(formData, "display_name");
  const email = readField(formData, "email").toLowerCase();
  const password = readField(formData, "password");

  if (!displayName || !email || !password) redirect("/connexion?erreur=champs&mode=inscription");
  if (displayName.length > 64) redirect("/connexion?erreur=pseudo&mode=inscription");
  if (password.length < 10) redirect("/connexion?erreur=mot-de-passe&mode=inscription");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${siteUrl}/auth/confirm`,
    },
  });

  if (error) redirect("/connexion?erreur=inscription&mode=inscription");

  revalidatePath("/", "layout");
  if (data.session) redirect("/compte");
  redirect("/connexion?message=confirmation&mode=inscription");
}
