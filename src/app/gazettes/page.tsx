import { SiteHeader } from "@/components/site-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatPublicationDate, gazettes } from "@/content/editorial-content";

export default function GazettesPage() {
  const gazette = gazettes[0];
  const lead = gazette.articles.find((article) => article.kind === "lead");
  const column = gazette.articles.find((article) => article.kind === "column");
  const brief = gazette.articles.find((article) => article.kind === "brief");
  const recipe = gazette.articles.find((article) => article.kind === "recipe");
  const quote = gazette.articles.find((article) => article.kind === "quote");

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
        <header className="section-heading section-heading--row">
          <div>
            <p className="eyebrow">Numéro d’essai</p>
            <h2 id="gazette-library-title">Feuilleter la Gazette</h2>
          </div>
          <span className="status-pill status-pill--quiet">Maquette éditoriale</span>
        </header>

        <p className="gazette-library__intro">
          Ce numéro zéro sert de laboratoire visuel : plusieurs formats d’articles sont déjà
          représentés afin de préparer ce qui pourra être composé plus tard depuis l’administration.
        </p>

        <article className="gazette-issue" id={gazette.slug}>
          <header className="gazette-issue__header">
            <div className="gazette-issue__strapline">
              <span>Édition {String(gazette.issueNumber).padStart(2, "0")}</span>
              <span>{formatPublicationDate(gazette.publishedAt)}</span>
              <span>Imetheran · Éorzéa et au-delà</span>
            </div>
            <div className="gazette-issue__masthead">{gazette.title}</div>
            <div className="gazette-issue__rule" aria-hidden="true"><span>✦</span></div>
          </header>

          <div
            className="gazette-issue__hero"
            style={{ backgroundImage: `linear-gradient(180deg, rgba(11,8,5,.05), rgba(11,8,5,.64)), url(${gazette.coverImage})` }}
            aria-hidden="true"
          >
            <div>
              <span>À la une</span>
              <strong>{gazette.headline}</strong>
            </div>
          </div>

          <div className="gazette-issue__deck">
            <p>{gazette.excerpt}</p>
            <ul>
              {gazette.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
            </ul>
          </div>

          <div className="gazette-paper">
            {lead && (
              <section className="gazette-article gazette-article--lead">
                <p className="gazette-article__kicker">{lead.kicker}</p>
                <h2>{lead.title}</h2>
                {lead.byline && <p className="gazette-article__byline">Par {lead.byline}</p>}
                <div className="gazette-article__columns">
                  {lead.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                </div>
              </section>
            )}

            <aside className="gazette-paper__sidebar">
              {column && (
                <section className="gazette-article gazette-article--column">
                  <p className="gazette-article__kicker">{column.kicker}</p>
                  <h3>{column.title}</h3>
                  {column.byline && <p className="gazette-article__byline">Par {column.byline}</p>}
                  {column.aside && <blockquote>{column.aside}</blockquote>}
                  {column.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                </section>
              )}

              {brief && (
                <section className="gazette-article gazette-article--brief">
                  <p className="gazette-article__kicker">{brief.kicker}</p>
                  <h3>{brief.title}</h3>
                  {brief.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                  {brief.aside && <div className="gazette-article__notice">{brief.aside}</div>}
                </section>
              )}
            </aside>

            {recipe && (
              <section className="gazette-article gazette-article--recipe">
                <div>
                  <p className="gazette-article__kicker">{recipe.kicker}</p>
                  <h3>{recipe.title}</h3>
                  {recipe.byline && <p className="gazette-article__byline">Par {recipe.byline}</p>}
                </div>
                <div>
                  {recipe.aside && <div className="gazette-article__recipe-box">{recipe.aside}</div>}
                  {recipe.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                </div>
              </section>
            )}

            {quote && (
              <section className="gazette-article gazette-article--quote">
                <p className="gazette-article__kicker">{quote.kicker}</p>
                {quote.aside && <blockquote>{quote.aside}</blockquote>}
                <h3>{quote.title}</h3>
                {quote.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              </section>
            )}
          </div>

          <footer className="gazette-issue__footer">
            <span>Numéro zéro · contenu de démonstration</span>
            <span>La Gazette d’Imetheran</span>
            <span>Page 1</span>
          </footer>
        </article>
      </section>
    </main>
  );
}
