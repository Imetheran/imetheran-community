import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { ForumTopicEditor } from "@/components/forum-topic-editor";
import { forumSections } from "@/content/forum-content";

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

export default async function NewForumTopicPage({ params }: { params: Promise<{ board: string }> }) {
  const { board: boardSlug } = await params;
  const match = findBoard(boardSlug);
  if (!match) notFound();

  const { board, section } = match;

  return (
    <main className="site-shell forum-new-topic-page">
      <SiteHeader />

      <section className="forum-compose-head">
        <div className="content-frame">
          <nav className="forum-breadcrumbs" aria-label="Fil d’Ariane">
            <Link href="/forum">Forum</Link><span>›</span>
            <span>{section.title}</span><span>›</span>
            <Link href={`/forum/${board.slug}`}>{board.title}</Link><span>›</span><strong>Nouveau sujet</strong>
          </nav>
          <p className="eyebrow">Prototype membre</p>
          <h1>Nouveau sujet</h1>
          <p>Une première maquette de l’éditeur qui servira aussi bien aux discussions hors-RP qu’aux scènes rôleplay.</p>
        </div>
      </section>

      <section className="content-frame forum-compose-workspace">
        {section.access === "members" ? (
          <div className="forum-access-note">
            <span aria-hidden="true">◇</span>
            <p><strong>Création réservée aux membres.</strong> L’écran reste visible en démonstration tant que l’authentification n’est pas branchée.</p>
          </div>
        ) : null}
        <ForumTopicEditor boardTitle={board.title} isRoleplay={section.mode === "rp"} />
      </section>
    </main>
  );
}
