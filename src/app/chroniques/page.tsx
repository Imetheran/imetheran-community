import { SiteHeader } from "@/components/site-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { chronicles, formatPublicationDate } from "@/content/editorial-content";

const chapterStatusLabel = {
  completed: "Terminé",
  active: "En cours",
  upcoming: "À venir",
} as const;

export default function ChroniquesPage() {
  const chronicle = chronicles[0];

  return (
    <main className="site-shell chronicles-page">
      <SiteHeader />

      <section className="chronicle-hero" aria-labelledby="chronicle-title">
        <div
          className="chronicle-hero__image"
          style={{ backgroundImage: `url(${chronicle.coverImage})` }}
          aria-hidden="true"
        />
        <div className="chronicle-hero__veil" aria-hidden="true" />
        <div className="content-frame chronicle-hero__content">
          <div className="chronicle-hero__status">
            <span className="status-pill">Ouverte</span>
            <span>Chronique d’exemple · contenu provisoire</span>
          </div>
          <p className="eyebrow">Les fils rouges d’Imetheran</p>
          <h1 id="chronicle-title">{chronicle.title}</h1>
          <p className="chronicle-hero__subtitle">{chronicle.subtitle}</p>
          <p className="chronicle-hero__synopsis">{chronicle.synopsis}</p>
          <div className="chronicle-hero__tags">
            {chronicle.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
          <ThemeToggle />
        </div>
      </section>

      <section className="chronicle-dossier content-frame" id={chronicle.slug} aria-labelledby="chronicle-dossier-title">
        <header className="section-heading section-heading--row">
          <div>
            <p className="eyebrow">Dossier de chronique</p>
            <h2 id="chronicle-dossier-title">Le scénario et sa progression</h2>
          </div>
          <span className="status-pill status-pill--quiet">Maquette éditoriale</span>
        </header>

        <div className="chronicle-layout">
          <aside className="chronicle-sidebar">
            <section className="chronicle-info-card">
              <p className="chronicle-info-card__label">Repères</p>
              <dl>
                <div><dt>Statut</dt><dd>Ouverte</dd></div>
                <div><dt>Début</dt><dd>{formatPublicationDate(chronicle.startedAt)}</dd></div>
                <div><dt>Lieu</dt><dd>{chronicle.location}</dd></div>
                <div><dt>Organisation</dt><dd>{chronicle.organizer}</dd></div>
              </dl>
            </section>

            <section className="chronicle-info-card">
              <p className="chronicle-info-card__label">Personnages impliqués</p>
              <ul className="chronicle-participants">
                {chronicle.participants.map((participant, index) => (
                  <li key={participant}>
                    <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    {participant}
                  </li>
                ))}
              </ul>
              <p className="chronicle-info-card__note">
                Noms de démonstration. À terme, les participants seront liés aux fiches de personnages.
              </p>
            </section>

            <section className="chronicle-info-card chronicle-info-card--hook">
              <p className="chronicle-info-card__label">Intention</p>
              <p>{chronicle.hook}</p>
            </section>
          </aside>

          <article className="chronicle-story">
            <div className="chronicle-story__intro">
              <p className="panel__kicker">Synopsis</p>
              <h2>{chronicle.title}</h2>
              <p>{chronicle.synopsis}</p>
            </div>

            <div className="chronicle-timeline" aria-label="Progression de la chronique">
              {chronicle.chapters.map((chapter) => (
                <section
                  className={`chronicle-chapter chronicle-chapter--${chapter.status}`}
                  key={chapter.id}
                >
                  <div className="chronicle-chapter__rail" aria-hidden="true">
                    <span />
                  </div>
                  <div className="chronicle-chapter__content">
                    <div className="chronicle-chapter__heading">
                      <div>
                        <p>{chapter.act}</p>
                        <h3>{chapter.title}</h3>
                      </div>
                      <span className="chronicle-chapter__status">
                        {chapterStatusLabel[chapter.status]}
                      </span>
                    </div>
                    <p className="chronicle-chapter__summary">{chapter.summary}</p>
                    <div className="chronicle-chapter__body">
                      {chapter.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                    </div>
                    {chapter.forumLabel && (
                      <div className="chronicle-chapter__forum">
                        <span>Forum lié</span>
                        <strong>{chapter.forumLabel}</strong>
                      </div>
                    )}
                  </div>
                </section>
              ))}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
