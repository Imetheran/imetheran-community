"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://imetheran-community.vercel.app";

function readField(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function safeReturnTo(value: string) {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\0")) return "/compte";
  return value;
}

function withReturn(path: string, returnTo: string) {
  if (returnTo === "/compte") return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}retour=${encodeURIComponent(returnTo)}`;
}

export async function login(formData: FormData) {
  const email = readField(formData, "email").toLowerCase();
  const password = readField(formData, "password");
  const returnTo = safeReturnTo(readField(formData, "return_to"));

  if (!email || !password) redirect(withReturn("/connexion?erreur=champs", returnTo));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) redirect(withReturn("/connexion?erreur=identifiants", returnTo));

  revalidatePath("/", "layout");
  redirect(returnTo);
}

export async function signup(formData: FormData) {
  const displayName = readField(formData, "display_name");
  const email = readField(formData, "email").toLowerCase();
  const password = readField(formData, "password");
  const returnTo = safeReturnTo(readField(formData, "return_to"));

  if (!displayName || !email || !password) redirect(withReturn("/connexion?erreur=champs&mode=inscription", returnTo));
  if (displayName.length > 64) redirect(withReturn("/connexion?erreur=pseudo&mode=inscription", returnTo));
  if (password.length < 10) redirect(withReturn("/connexion?erreur=mot-de-passe&mode=inscription", returnTo));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${siteUrl}/auth/confirm?next=${encodeURIComponent(returnTo)}`,
    },
  });

  if (error) redirect(withReturn("/connexion?erreur=inscription&mode=inscription", returnTo));

  revalidatePath("/", "layout");
  if (data.session) redirect(returnTo);
  redirect(withReturn("/connexion?message=confirmation&mode=inscription", returnTo));
}

export async function requestPasswordReset(formData: FormData) {
  const email = readField(formData, "email").toLowerCase();

  if (!email) redirect("/connexion?erreur=champs&mode=recuperation");

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/confirm?next=${encodeURIComponent("/compte/mot-de-passe")}`,
  });

  if (error) redirect("/connexion?erreur=recuperation&mode=recuperation");

  redirect("/connexion?message=recuperation&mode=recuperation");
}
