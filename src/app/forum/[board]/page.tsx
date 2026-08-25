import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { ForumBoardTopics } from "@/components/forum-board-topics";
import { forumSections } from "@/content/forum-content";
import { getDemoTopicsForBoard } from "@/content/forum-demo-content";

export function generateStaticParams() {
  return forumSections.flatMap((section) => section.boards.map((board) => ({ board: board.slug })));
}

function findBoard(slug: string) {
  for (const section of forumSections) {
    const board = section.boards.find((item) => item.slug === slug);
    if (board) return { board, section };
  }
  return null;
}

export default async function ForumBoardPage({ params }: { params: Promise<{ board: string }> }) {
  const { board: boardSlug } = await params;
  const match = findBoard(boardSlug);
  if (!match) notFound();

  const { board, section } = match;
  const topics = getDemoTopicsForBoard(board.slug);

  return (
    <main className="site-shell forum-board-page">
      <SiteHeader />

      <section className="forum-subhero">
        <div className="forum-subhero__image" aria-hidden="true" />
        <div className="forum-subhero__veil" aria-hidden="true" />
        <div className="content-frame forum-subhero__content">
          <nav className="forum-breadcrumbs" aria-label="Fil d’Ariane">
            <Link href="/forum">Forum</Link><span>›</span><span>{section.title}</span><span>›</span><strong>{board.title}</strong>
          </nav>
          <div className="forum-subhero__heading">
            <div>
              <p className="eyebrow">{section.mode === "rp" ? "Espace rôleplay" : "Espace hors-RP"}</p>
              <h1>{board.title}</h1>
              <p>{board.description}</p>
            </div>
            <div className="forum-subhero__meta">
              <span className={`forum-section__mode forum-section__mode--${section.mode}`}>{section.mode === "rp" ? "RP" : "Hors-RP"}</span>
              {section.access === "members" ? <span className="forum-section__access forum-section__access--members">Membres uniquement</span> : null}
              {section.access === "guest-read" ? <span className="forum-section__access forum-section__access--guest-read">Lecture invités</span> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="forum-board-view content-frame">
        <div className="forum-board-toolbar">
          <div>
            <Link className="text-link" href="/forum">← Retour à l’index</Link>
            <span className="forum-board-toolbar__demo">Données de démonstration</span>
          </div>
          <Link className="button button--primary button--small" href={`/forum/${board.slug}/nouveau`}>Nouveau sujet</Link>
        </div>

        {section.access === "members" ? (
          <div className="forum-access-note">
            <span aria-hidden="true">◇</span>
            <p><strong>Prototype visible pour validation.</strong> Dans la version connectée, cette section nécessitera un compte membre pour être consultée.</p>
          </div>
        ) : null}

        {topics.length > 0 ? (
          <ForumBoardTopics boardSlug={board.slug} topics={topics} />
        ) : (
          <div className="forum-empty-board">
            <span aria-hidden="true">✦</span>
            <div>
              <p className="eyebrow">Forum prêt</p>
              <h2>Aucun sujet de démonstration ici</h2>
              <p>La route, les permissions et la structure de ce forum sont en place. Les vrais sujets viendront du backend une fois celui-ci connecté.</p>
              <Link className="button button--ghost button--small" href={`/forum/${board.slug}/nouveau`}>Voir l’éditeur de sujet</Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
