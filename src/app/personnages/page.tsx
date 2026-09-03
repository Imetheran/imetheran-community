import Link from "next/link";
import { CharacterDirectoryBrowser, type CharacterDirectoryItem } from "@/components/character-directory-browser";
import { SiteHeader } from "@/components/site-header";
import { signedCharacterPortraitMap } from "@/lib/character-portraits";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CharacterRow = {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  epithet: string;
  short_summary: string;
  portrait_path: string | null;
  visibility: string;
  status: string;
  world: string;
  people: string;
  occupation: string;
  traits: string[];
  is_featured: boolean;
  is_moderation_hidden: boolean;
  created_at: string;
};

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase("fr") ?? "").join("") || "IM";
}

function statusLabel(status: string, visibility: string, hidden: boolean) {
  if (hidden) return "Masquée par l’équipe";
  if (status === "draft") return "Brouillon";
  if (status === "archived") return "Archivée";
  if (visibility === "private") return "Privée";
  if (visibility === "unlisted") return "Non répertoriée";
  return "Publique";
}

export default async function CharactersPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;

  const publicResult = await supabase
    .from("characters")
    .select("id, owner_id, slug, name, epithet, short_summary, portrait_path, visibility, status, world, people, occupation, traits, is_featured, is_moderation_hidden, created_at")
    .eq("status", "published")
    .eq("visibility", "public")
    .eq("is_moderation_hidden", false)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  const publicCharacters = (publicResult.data ?? []) as CharacterRow[];
  const ownCharacters = userId
    ? ((await supabase
        .from("characters")
        .select("id, owner_id, slug, name, epithet, short_summary, portrait_path, visibility, status, world, people, occupation, traits, is_featured, is_moderation_hidden, created_at")
        .eq("owner_id", userId)
        .order("updated_at", { ascending: false })).data ?? []) as CharacterRow[]
    : [];
  const featured = publicCharacters.find((character) => character.is_featured) ?? null;
  const portraitMap = await signedCharacterPortraitMap(supabase, publicCharacters);
  const featuredPortrait = featured ? portraitMap.get(featured.id) ?? null : null;
  const directoryCharacters = featured
    ? publicCharacters.filter((character) => character.id !== featured.id)
    : publicCharacters;
  const directoryItems: CharacterDirectoryItem[] = directoryCharacters.map((character) => ({
    id: character.id,
    slug: character.slug,
    name: character.name,
    epithet: character.epithet ?? "",
    shortSummary: character.short_summary ?? "",
    portrait: portraitMap.get(character.id) ?? null,
    world: character.world ?? "",
    people: character.people ?? "",
    occupation: character.occupation ?? "",
    traits: Array.isArray(character.traits) ? character.traits : [],
    createdAt: character.created_at,
  }));

  return (
    <main className="site-shell characters-page">
      <SiteHeader />

      <section className="characters-hero" aria-labelledby="characters-title">
        <div className="characters-hero__image" aria-hidden="true" />
        <div className="characters-hero__veil" aria-hidden="true" />
        <div className="content-frame characters-hero__content">
          <p className="eyebrow">Carnet de rencontres</p>
          <h1 id="characters-title">Personnages</h1>
          <p>Les fiches rôleplay réellement publiées par les membres d’Imetheran, reliées à leur activité dans le forum.</p>
          <div className="characters-hero__actions">
            <Link className="button button--primary" href="/personnages/nouveau">Créer mon personnage</Link>
          </div>
        </div>
      </section>

      <section className="character-directory content-frame" aria-labelledby="directory-title">
        <header className="section-heading section-heading--row">
          <div><p className="eyebrow">Répertoire communautaire</p><h2 id="directory-title">Les visages d’Imetheran</h2></div>
          <span className="status-pill status-pill--quiet">{publicCharacters.length} fiche{publicCharacters.length > 1 ? "s" : ""} publique{publicCharacters.length > 1 ? "s" : ""}</span>
        </header>

        {featured ? (
          <article className="character-spotlight">
            <div className="character-spotlight__portrait" aria-hidden="true">
              {featuredPortrait ? <img className="character-live-portrait" src={featuredPortrait} alt="" /> : <span>{initials(featured.name)}</span>}
              <small>Personnage mis en avant</small>
            </div>
            <div className="character-spotlight__body">
              <p className="panel__kicker">Personnage mis en avant</p>
              <h2>{featured.name}</h2>
              <p className="character-spotlight__epithet">{featured.epithet || "Personnage rôleplay"}</p>
              <p>{featured.short_summary || "Aucun résumé renseigné."}</p>
              <div className="character-spotlight__meta"><span>{featured.people || "Peuple"}</span><span>{featured.occupation || "Occupation"}</span><span>{featured.world || "Monde"}</span></div>
              <Link className="button button--primary" href={`/personnages/${featured.slug}`}>Ouvrir la fiche</Link>
            </div>
          </article>
        ) : null}

        {userId && ownCharacters.length > 0 ? (
          <section className="character-own-panel" aria-labelledby="own-characters-title">
            <div><p className="eyebrow">Mon espace</p><h2 id="own-characters-title">Mes personnages</h2></div>
            <div className="character-own-panel__list">
              {ownCharacters.map((character) => (
                <Link href={`/personnages/${character.slug}`} key={character.id}>
                  <strong>{character.name}</strong>
                  <span>{statusLabel(character.status, character.visibility, character.is_moderation_hidden)}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {directoryItems.length > 0 ? (
          <CharacterDirectoryBrowser characters={directoryItems} />
        ) : publicCharacters.length === 0 ? (
          <div className="character-live-empty">
            <strong>Aucun personnage public pour le moment.</strong>
            <p>Les fiches publiées par les membres apparaîtront ici automatiquement.</p>
            <Link className="button button--primary button--small" href="/personnages/nouveau">Créer la première fiche</Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
