"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMemberParticipation } from "@/lib/member-participation";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VISIBILITIES = new Set(["public", "unlisted", "private"]);
const INTENTS = new Set(["draft", "publish", "archive"]);
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_PORTRAIT_SIZE = 4 * 1024 * 1024;

function readField(formData: FormData, key: string, maxLength: number) {
  return String(formData.get(key) ?? "").trim().slice(0, maxLength);
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 68) || "personnage";
}

function readTraits(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((trait) => trait.trim())
        .filter(Boolean)
        .map((trait) => trait.slice(0, 48)),
    ),
  ).slice(0, 8);
}

function readHooks(formData: FormData) {
  return [0, 1, 2]
    .map((index) => ({
      title: readField(formData, `hook_title_${index}`, 100),
      text: readField(formData, `hook_text_${index}`, 800),
    }))
    .filter((hook) => hook.title || hook.text);
}

async function requireMember(returnTo: string) {
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
  revalidatePath("/compte");
  revalidatePath("/administration");
  revalidatePath("/administration/personnages");
}

export async function saveCharacter(formData: FormData) {
  const characterId = String(formData.get("character_id") ?? "");
  const editing = UUID_PATTERN.test(characterId);
  const returnTo = editing ? `/personnages/${readField(formData, "current_slug", 90)}/modifier` : "/personnages/nouveau";
  const { supabase, userId } = await requireMember(returnTo);
  const participation = await getMemberParticipation(supabase, userId);

  if (!participation.canParticipate) {
    redirect("/compte?message=participation-suspendue");
  }

  const name = readField(formData, "name", 80);
  const epithet = readField(formData, "epithet", 120);
  const shortSummary = readField(formData, "short_summary", 600);
  const world = readField(formData, "world", 80);
  const people = readField(formData, "people", 80);
  const age = readField(formData, "age", 40);
  const origin = readField(formData, "origin", 120);
  const residence = readField(formData, "residence", 120);
  const occupation = readField(formData, "occupation", 120);
  const affiliation = readField(formData, "affiliation", 160);
  const quote = readField(formData, "quote", 300);
  const biography = String(formData.get("biography") ?? "").trim().slice(0, 30000);
  const traits = readTraits(String(formData.get("traits") ?? ""));
  const hooks = readHooks(formData);
  const visibilityValue = String(formData.get("visibility") ?? "public");
  const visibility = VISIBILITIES.has(visibilityValue) ? visibilityValue : "public";
  const intentValue = String(formData.get("intent") ?? "draft");
  const intent = INTENTS.has(intentValue) ? intentValue : "draft";
  const status = intent === "publish" ? "published" : intent === "archive" && editing ? "archived" : "draft";

  if (!name || shortSummary.length > 600 || biography.length > 30000) {
    redirect(`${returnTo}?erreur=champs`);
  }

  const portrait = formData.get("portrait");
  if (portrait instanceof File && portrait.size > 0) {
    if (!IMAGE_TYPES.has(portrait.type) || portrait.size > MAX_PORTRAIT_SIZE) {
      redirect(`${returnTo}?erreur=portrait`);
    }
  }

  const payload = {
    name,
    epithet,
    short_summary: shortSummary,
    world,
    people,
    age,
    origin,
    residence,
    occupation,
    affiliation,
    quote,
    traits,
    biography,
    hooks,
    visibility,
    status,
  };

  let saved: { id: string; slug: string; portrait_path: string | null } | null = null;

  if (editing) {
    const { data: existing } = await supabase
      .from("characters")
      .select("id, slug, owner_id, portrait_path")
      .eq("id", characterId)
      .eq("owner_id", userId)
      .maybeSingle();

    if (!existing) redirect("/personnages");

    const { data, error } = await supabase
      .from("characters")
      .update(payload)
      .eq("id", characterId)
      .eq("owner_id", userId)
      .select("id, slug, portrait_path")
      .single();

    if (error || !data) redirect(`${returnTo}?erreur=enregistrement`);
    saved = data;
  } else {
    const slug = `${slugify(name)}-${randomUUID().slice(0, 8)}`;
    const { data, error } = await supabase
      .from("characters")
      .insert({
        ...payload,
        owner_id: userId,
        slug,
        published_at: status === "published" ? new Date().toISOString() : null,
      })
      .select("id, slug, portrait_path")
      .single();

    if (error || !data) redirect("/personnages/nouveau?erreur=enregistrement");
    saved = data;
  }

  if (portrait instanceof File && portrait.size > 0) {
    const portraitPath = `${userId}/${saved.id}/portrait`;
    const { error: uploadError } = await supabase.storage
      .from("character-portraits")
      .upload(portraitPath, portrait, {
        upsert: true,
        contentType: portrait.type,
        cacheControl: "3600",
      });

    if (uploadError) {
      refreshCharacterPaths(saved.slug);
      redirect(`/personnages/${saved.slug}/modifier?erreur=portrait`);
    }

    const { error: portraitUpdateError } = await supabase
      .from("characters")
      .update({ portrait_path: portraitPath })
      .eq("id", saved.id)
      .eq("owner_id", userId);

    if (portraitUpdateError) {
      refreshCharacterPaths(saved.slug);
      redirect(`/personnages/${saved.slug}/modifier?erreur=portrait`);
    }
  }

  refreshCharacterPaths(saved.slug);
  const message = status === "published" ? "publie" : status === "archived" ? "archive" : "brouillon";
  redirect(`/personnages/${saved.slug}?message=${message}`);
}
