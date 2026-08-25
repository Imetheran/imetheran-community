import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
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
  const pinned = topics.filter((topic) => topic.pinned);
  const regular = topics.filter((topic) => !topic.pinned);

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
          <div className="forum-topic-groups">
            {pinned.length > 0 ? (
              <section className="forum-topic-group">
                <header><span>Épinglés</span><small>{pinned.length} sujet{pinned.length > 1 ? "s" : ""}</small></header>
                <div className="forum-topic-list">
                  {pinned.map((topic) => <TopicRow key={topic.id} boardSlug={board.slug} topic={topic} />)}
                </div>
              </section>
            ) : null}

            <section className="forum-topic-group">
              <header><span>Sujets</span><small>{regular.length} sujet{regular.length > 1 ? "s" : ""}</small></header>
              <div className="forum-topic-list">
                {regular.map((topic) => <TopicRow key={topic.id} boardSlug={board.slug} topic={topic} />)}
              </div>
            </section>
          </div>
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

function TopicRow({ boardSlug, topic }: { boardSlug: string; topic: ReturnType<typeof getDemoTopicsForBoard>[number] }) {
  return (
    <Link className={`forum-topic-row${topic.pinned ? " forum-topic-row--pinned" : ""}`} href={`/forum/${boardSlug}/sujet/${topic.slug}`}>
      <span className="forum-topic-row__state" aria-hidden="true">{topic.locked ? "◆" : topic.pinned ? "✦" : "◇"}</span>
      <div className="forum-topic-row__main">
        <div className="forum-topic-row__title">
          <h2>{topic.title}</h2>
          {topic.pinned ? <span>Épinglé</span> : null}
          {topic.locked ? <span>Verrouillé</span> : null}
          {topic.status === "finished" ? <span>Terminé</span> : null}
        </div>
        <p>{topic.excerpt}</p>
        <div className="forum-topic-row__tags">{topic.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      </div>
      <div className="forum-topic-row__author">
        <span>{topic.author.initials}</span>
        <div><small>Ouvert par</small><strong>{topic.author.name}</strong><em>{topic.createdAt}</em></div>
      </div>
      <div className="forum-topic-row__numbers">
        <span><strong>{topic.replies}</strong><small>Réponses</small></span>
        <span><strong>{topic.views}</strong><small>Vues</small></span>
      </div>
      <div className="forum-topic-row__last"><small>Dernière activité</small><strong>{topic.lastActivity}</strong></div>
    </Link>
  );
}
