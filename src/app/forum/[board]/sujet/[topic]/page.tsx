import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { forumSections } from "@/content/forum-content";
import { demoTopics, getDemoTopic } from "@/content/forum-demo-content";

export function generateStaticParams() {
  return demoTopics.map((topic) => ({ board: topic.boardSlug, topic: topic.slug }));
}

function findBoard(slug: string) {
  for (const section of forumSections) {
    const board = section.boards.find((item) => item.slug === slug);
    if (board) return { board, section };
  }
  return null;
}

export default async function ForumTopicPage({
  params,
}: {
  params: Promise<{ board: string; topic: string }>;
}) {
  const { board: boardSlug, topic: topicSlug } = await params;
  const match = findBoard(boardSlug);
  const topic = getDemoTopic(boardSlug, topicSlug);

  if (!match || !topic) notFound();
  const { board, section } = match;

  return (
    <main className="site-shell forum-thread-page">
      <SiteHeader />

      <section className="forum-thread-head">
        <div className="content-frame">
          <nav className="forum-breadcrumbs" aria-label="Fil d’Ariane">
            <Link href="/forum">Forum</Link><span>›</span>
            <span>{section.title}</span><span>›</span>
            <Link href={`/forum/${board.slug}`}>{board.title}</Link>
          </nav>

          <div className="forum-thread-head__layout">
            <div>
              <div className="forum-thread-head__badges">
                {topic.pinned ? <span className="forum-board__badge">Épinglé</span> : null}
                {topic.locked ? <span className="forum-board__badge">Verrouillé</span> : null}
                {topic.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
              <h1>{topic.title}</h1>
              <p>{topic.excerpt}</p>
            </div>
            <div className="forum-thread-head__stats">
              <span><strong>{topic.replies}</strong><small>Réponses</small></span>
              <span><strong>{topic.views}</strong><small>Vues</small></span>
            </div>
          </div>
        </div>
      </section>

      <section className="forum-thread content-frame">
        <div className="forum-thread__toolbar">
          <Link className="text-link" href={`/forum/${board.slug}`}>← Retour aux sujets</Link>
          <div>
            <button className="button button--ghost button--small" type="button" disabled>Suivre le sujet</button>
            {!topic.locked ? <a className="button button--primary button--small" href="#repondre">Répondre</a> : null}
          </div>
        </div>

        <div className="forum-thread__demo-note">
          <span aria-hidden="true">✦</span>
          <p><strong>Sujet fictif de démonstration.</strong> Il sert à valider la lecture, les identités membre/personnage et la future structure des messages.</p>
        </div>

        <div className="forum-posts">
          {topic.posts.length > 0 ? topic.posts.map((post, index) => (
            <article className="forum-post" id={post.id} key={post.id}>
              <aside className="forum-post__author">
                <div className="forum-post__avatar" aria-hidden="true">{post.author.initials}</div>
                <strong>{post.author.name}</strong>
                <span className={`forum-post__role forum-post__role--${post.author.role}`}>{post.author.role === "staff" ? "Équipe" : "Membre"}</span>
                {post.author.characterName && post.author.characterSlug ? (
                  <Link className="forum-post__character" href={`/personnages/${post.author.characterSlug}`}>
                    <small>Écrit avec</small>
                    <span>{post.author.characterName}</span>
                  </Link>
                ) : null}
              </aside>

              <div className="forum-post__body">
                <header>
                  <div>
                    <span className="forum-post__number">#{index + 1}</span>
                    <time>{post.postedAt}</time>
                    {post.editedAt ? <small>Modifié {post.editedAt}</small> : null}
                  </div>
                  <div className="forum-post__actions" aria-label="Actions du message">
                    <button type="button" disabled>Citer</button>
                    <button type="button" disabled>Signaler</button>
                  </div>
                </header>

                <div className="forum-post__content">
                  {post.content.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}
                </div>

                {post.signature ? <footer className="forum-post__signature">{post.signature}</footer> : null}
              </div>
            </article>
          )) : (
            <div className="forum-empty-board">
              <span aria-hidden="true">✦</span>
              <div>
                <p className="eyebrow">Aperçu</p>
                <h2>Le contenu détaillé de ce sujet n’est pas encore maquetté</h2>
                <p>{topic.excerpt}</p>
                <Link className="button button--ghost button--small" href={`/forum/roleplay-libre/sujet/les-lanternes-de-la-rue-des-saphirs`}>Voir le sujet complet de démonstration</Link>
              </div>
            </div>
          )}
        </div>

        {!topic.locked ? (
          <section className="forum-reply-box" id="repondre" aria-labelledby="reply-title">
            <div className="forum-reply-box__heading">
              <div><p className="eyebrow">Prototype</p><h2 id="reply-title">Répondre au sujet</h2></div>
              <span className="status-pill status-pill--quiet">Non enregistré</span>
            </div>
            <div className="forum-reply-box__identity">
              <span>Publier en tant que</span>
              <button type="button" disabled>{topic.author.characterName ?? topic.author.name} ▾</button>
              <small>Le compte reste toujours l’auteur technique ; un personnage peut être attaché au message RP.</small>
            </div>
            <textarea aria-label="Contenu de la réponse" placeholder="Écrivez votre réponse…" rows={9} />
            <div className="forum-reply-box__footer">
              <span>Markdown / éditeur enrichi à définir plus tard.</span>
              <button className="button button--primary button--small" type="button" disabled>Publier la réponse</button>
            </div>
          </section>
        ) : (
          <div className="forum-thread-locked">Ce sujet est verrouillé. Aucune nouvelle réponse ne peut être publiée.</div>
        )}
      </section>
    </main>
  );
}
