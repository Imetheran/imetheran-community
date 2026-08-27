import { notFound, redirect } from "next/navigation";
import { CharacterEditor, type EditableCharacter } from "@/components/character-editor";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function errorMessage(code?: string) {
  if (code === "portrait") return "Le portrait n’a pas pu être enregistré. Utilisez un JPG, PNG ou WebP de 4 Mo maximum.";
  if (code === "enregistrement") return "Les modifications n’ont pas pu être enregistrées.";
  if (code === "champs") return "Vérifiez les champs de la fiche avant de l’enregistrer.";
  return null;
}

export default async function EditCharacterPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ erreur?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string") {
    redirect(`/connexion?message=connexion-requise&retour=${encodeURIComponent(`/personnages/${slug}/modifier`)}`);
  }

  const { data: character } = await supabase
    .from("characters")
    .select("id, owner_id, slug, name, epithet, short_summary, world, people, age, origin, residence, occupation, affiliation, quote, traits, biography, hooks, visibility, status, portrait_path, is_moderation_hidden, moderation_note")
    .eq("slug", slug)
    .eq("owner_id", userId)
    .maybeSingle();

  if (!character) notFound();

  const portraitUrl = character.portrait_path
    ? supabase.storage.from("character-portraits").getPublicUrl(character.portrait_path).data.publicUrl
    : null;
  const rawHooks = Array.isArray(character.hooks) ? character.hooks : [];
  const hooks = rawHooks
    .filter((hook): hook is { title?: unknown; text?: unknown } => Boolean(hook) && typeof hook === "object")
    .map((hook) => ({ title: String(hook.title ?? ""), text: String(hook.text ?? "") }))
    .slice(0, 3);

  const initialCharacter: EditableCharacter = {
    id: character.id,
    slug: character.slug,
    name: character.name,
    epithet: character.epithet ?? "",
    short_summary: character.short_summary ?? "",
    world: character.world ?? "",
    people: character.people ?? "",
    age: character.age ?? "",
    origin: character.origin ?? "",
    residence: character.residence ?? "",
    occupation: character.occupation ?? "",
    affiliation: character.affiliation ?? "",
    quote: character.quote ?? "",
    traits: Array.isArray(character.traits) ? character.traits : [],
    biography: character.biography ?? "",
    hooks,
    visibility: character.visibility === "unlisted" || character.visibility === "private" ? character.visibility : "public",
    status: character.status,
    portraitUrl,
    is_moderation_hidden: Boolean(character.is_moderation_hidden),
    moderation_note: character.moderation_note ?? "",
  };

  return (
    <main className="site-shell character-editor-page">
      <SiteHeader />
      <section className="content-frame character-editor-page__content">
        <CharacterEditor mode="edit" initialCharacter={initialCharacter} notice={errorMessage(query.erreur)} />
      </section>
    </main>
  );
}
