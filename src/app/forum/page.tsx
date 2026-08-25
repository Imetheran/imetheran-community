import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { forumBoardCount, forumSections } from "@/content/forum-content";

function BoardIcon({ kind }: { kind: string }) {
  return (
    <span className={`forum-board__icon forum-board__icon--${kind}`} aria-hidden="true">
      <svg viewBox="0 0 40 40">
        <path d="M7 9.5h26v18H18l-7.5 5v-5H7z" />
        <path d="M12 15h16M12 20h11" />
      </svg>
    </span>
  );
}

export default function ForumPage() {
  return (
    <main className="site-shell forum-page">
      <SiteHeader />

      <section className="forum-hero" aria-labelledby="forum-title">
        <div className="forum-hero__image" aria-hidden="true" />
        <div className="forum-hero__veil" aria-hidden="true" />
        <div className="content-frame forum-hero__content">
          <p className="eyebrow">Place publique</p>
          <h1 id="forum-title">Forum</h1>
          <p>
            Le cœur des échanges d’Imetheran : vie communautaire, recherches de rôleplay,
            chroniques partagées, campagnes saisonnières et discussions autour de Final Fantasy XIV.
          </p>
          <div className="forum-hero__actions">
            <ThemeToggle />
            <Link className="button button--ghost" href="/personnages">Voir les personnages</Link>
          </div>
        </div>
      </section>

      <section className="forum-index content-frame" aria-labelledby="forum-index-title">
        <header className="forum-index__header">
          <div>
            <p className="eyebrow">Index communautaire</p>
            <h2 id="forum-index-title">Les espaces du forum</h2>
            <p>
              Cette structure reprend le squelette historique du forum. Les compteurs, sujets et derniers messages
              seront alimentés automatiquement lorsque le backend sera connecté.
            </p>
          </div>
          <div className="forum-index__summary" aria-label="Résumé du forum">
            <span><strong>{forumSections.length}</strong> catégories</span>
            <span><strong>{forumBoardCount}</strong> forums</span>
            <span><strong>0</strong> sujets publics</span>
          </div>
        </header>

        <div className="forum-index__notice">
          <div>
            <span className="forum-index__notice-mark" aria-hidden="true">✦</span>
            <div>
              <strong>Forum en préparation</strong>
              <p>La hiérarchie est réelle, mais aucune activité fictive n’est affichée avant l’ouverture du backend.</p>
            </div>
          </div>
          <span className="status-pill status-pill--quiet">Structure validable</span>
        </div>

        <div className="forum-sections">
          {forumSections.map((section, sectionIndex) => (
            <section className={`forum-section forum-section--${section.kind}`} key={section.id}>
              <header className="forum-section__header">
                <div className="forum-section__identity">
                  <span className="forum-section__number">{String(sectionIndex + 1).padStart(2, "0")}</span>
                  <div>
                    <p>{section.eyebrow}</p>
                    <h2>{section.title}</h2>
                  </div>
                </div>
                <p className="forum-section__subtitle">{section.subtitle}</p>
                {section.kind === "campaign" ? <span className="status-pill">Campagne active</span> : null}
              </header>

              <div className="forum-board-list">
                {section.boards.map((board) => (
                  <article className="forum-board" key={board.id}>
                    <BoardIcon kind={section.kind} />
                    <div className="forum-board__main">
                      <div className="forum-board__title-row">
                        <h3>{board.title}</h3>
                        {board.badge ? <span className="forum-board__badge">{board.badge}</span> : null}
                      </div>
                      <p>{board.description}</p>
                    </div>
                    <div className="forum-board__stats" aria-label={`Statistiques de ${board.title}`}>
                      <span><strong>{board.topics}</strong><small>Sujets</small></span>
                      <span><strong>{board.posts}</strong><small>Messages</small></span>
                    </div>
                    <div className="forum-board__last">
                      <small>Dernier message</small>
                      <strong>{board.lastActivity ?? "Aucune activité"}</strong>
                      <span>En attente de l’ouverture</span>
                    </div>
                    <span className="forum-board__arrow" aria-hidden="true">→</span>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="forum-index__footer">
          <div>
            <p className="eyebrow">Architecture évolutive</p>
            <strong>Les campagnes comme Evercold pourront être créées, remplacées ou archivées depuis l’administration.</strong>
          </div>
          <Link className="text-link" href="/">← Retour à l’accueil</Link>
        </footer>
      </section>
    </main>
  );
}
