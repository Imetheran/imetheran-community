import { SiteHeader } from "@/components/site-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatPublicationDate, gazettes } from "@/content/editorial-content";

export default function GazettesPage() {
  return (
    <main className="site-shell gazettes-page">
      <SiteHeader />

      <section className="gazette-hero" aria-labelledby="gazettes-title">
        <div className="gazette-hero__image" aria-hidden="true" />
        <div className="gazette-hero__veil" aria-hidden="true" />
        <div className="content-frame gazette-hero__content">
          <p className="eyebrow">Presse communautaire</p>
          <h1 id="gazettes-title">Gazettes</h1>
          <p>
            Le journal rôleplay d’Imetheran : nouvelles, potins, recettes, événements,
            chroniques courtes et illustrations réunis en éditions publiées par la communauté.
          </p>
          <ThemeToggle />
        </div>
      </section>

      <section className="gazette-library content-frame" aria-labelledby="gazette-library-title">
        <header className="section-heading">
          <p className="eyebrow">Les éditions</p>
          <h2 id="gazette-library-title">Bibliothèque des gazettes</h2>
          <p>
            Cette première édition sert d’exemple. Plus tard, chaque numéro pourra être créé,
            enregistré en brouillon, programmé, publié et mis en avant depuis l’administration.
          </p>
        </header>

        <div className="gazette-library__grid">
          {gazettes.map((gazette) => (
            <article className="gazette-library-card" id={gazette.slug} key={gazette.id}>
              <div
                className="gazette-library-card__image"
                style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.06), rgba(0,0,0,.62)), url(${gazette.coverImage})` }}
                aria-hidden="true"
              />
              <div className="gazette-library-card__body">
                <div className="gazette-library-card__meta">
                  <span className="status-pill">Publié</span>
                  <span>{gazette.edition}</span>
                  <span>{formatPublicationDate(gazette.publishedAt)}</span>
                </div>
                <h2>{gazette.headline}</h2>
                <p>{gazette.excerpt}</p>
                <ul>
                  {gazette.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
                </ul>
                <span className="gazette-library-card__note">
                  Numéro d’essai — contenu provisoire
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
