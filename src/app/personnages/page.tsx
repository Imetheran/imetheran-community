import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { characters, featuredCharacter } from "@/content/character-content";

export default function CharactersPage() {
  return (
    <main className="site-shell characters-page">
      <SiteHeader />

      <section className="characters-hero" aria-labelledby="characters-title">
        <div className="characters-hero__image" aria-hidden="true" />
        <div className="characters-hero__veil" aria-hidden="true" />
        <div className="content-frame characters-hero__content">
          <p className="eyebrow">Carnet de rencontres</p>
          <h1 id="characters-title">Personnages</h1>
          <p>
            Les fiches rôleplay des membres d’Imetheran : identité, histoire, accroches de jeu,
            relations et traces laissées dans les chroniques de la communauté.
          </p>
          <div className="characters-hero__actions">
            <Link className="button button--primary" href="/personnages/nouveau">Créer mon personnage</Link>
            <ThemeToggle />
          </div>
        </div>
      </section>

      <section className="character-directory content-frame" aria-labelledby="directory-title">
        <header className="section-heading section-heading--row">
          <div>
            <p className="eyebrow">Répertoire communautaire</p>
            <h2 id="directory-title">Les visages d’Imetheran</h2>
          </div>
          <span className="status-pill status-pill--quiet">Profils de démonstration</span>
        </header>

        <article className="character-spotlight">
          <div className="character-spotlight__portrait" aria-hidden="true">
            <span>{featuredCharacter.initials}</span>
            <small>Portrait membre</small>
          </div>
          <div className="character-spotlight__body">
            <p className="panel__kicker">Personnage mis en avant</p>
            <h2>{featuredCharacter.displayName}</h2>
            <p className="character-spotlight__epithet">{featuredCharacter.epithet}</p>
            <p>{featuredCharacter.summary}</p>
            <div className="character-spotlight__meta">
              <span>{featuredCharacter.people}</span>
              <span>{featuredCharacter.occupation}</span>
              <span>{featuredCharacter.world}</span>
            </div>
            <Link className="button button--primary" href={`/personnages/${featuredCharacter.slug}`}>
              Ouvrir la fiche
            </Link>
          </div>
        </article>

        <div className="character-directory__toolbar" aria-label="Aperçu des futurs filtres">
          <span><strong>{characters.length}</strong> profils d’exemple</span>
          <div>
            <span>Monde : tous</span>
            <span>Statut : actifs</span>
            <span>Tri : récents</span>
          </div>
        </div>

        <div className="character-grid">
          {characters.map((character) => (
            <Link className="character-card" href={`/personnages/${character.slug}`} key={character.id}>
              <div className="character-card__portrait" aria-hidden="true">
                <span>{character.initials}</span>
              </div>
              <div className="character-card__body">
                <small>{character.people} · {character.world}</small>
                <h3>{character.displayName}</h3>
                <p className="character-card__epithet">{character.epithet}</p>
                <p>{character.summary}</p>
                <div className="character-card__tags">
                  {character.traits.slice(0, 3).map((trait) => <span key={trait}>{trait}</span>)}
                </div>
              </div>
              <span className="character-card__arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
