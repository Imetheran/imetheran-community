import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Guides",
  description: "Guides communautaires pour le rôleplay, les personnages et les outils d’Imetheran.",
};

type GuideBoard = {
  id: string;
  slug: string;
  title: string;
  description: string;
  forum_sections:
    | { access_scope: string }
    | { access_scope: string }[]
    | null;
};

type GuideTopic = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  last_activity_at: string;
  tags: string[] | null;
  is_pinned: boolean;
};

const guidePaths = [
  {
    marker: "01",
    title: "Débuter en rôleplay",
    description:
      "Retrouvez les repères de la communauté pour préparer une scène, rejoindre un groupe et prendre vos marques sans vous perdre dans les usages.",
  },
  {
    marker: "02",
    title: "Créer un personnage",
    description:
      "Concept, cohérence, fiche et relations : le forum centralise les conseils qui aident à construire un personnage jouable sur la durée.",
  },
  {
    marker: "03",
    title: "Outils communautaires",
    description:
      "Fonctionnement du forum, chroniques, sociogramme et organisation : les guides expliquent comment utiliser les outils d’Imetheran au quotidien.",
  },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeZone: "Europe/Paris",
  }).format(new Date(value));
}

export default async function GuidesPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims as Record<string, unknown> | undefined;
  const userId = typeof claims?.sub === "string" ? claims.sub : null;

  const { data: boardData, error: boardError } = await supabase
    .from("forum_boards")
    .select("id, slug, title, description, forum_sections!inner(access_scope)")
    .eq("slug", "guide-du-roliste")
    .eq("is_active", true)
    .maybeSingle();

  const board = (boardData ?? null) as GuideBoard | null;
  const section = Array.isArray(board?.forum_sections)
    ? board?.forum_sections[0]
    : board?.forum_sections;
  const restricted = section?.access_scope === "members" && !userId;

  let topics: GuideTopic[] = [];
  let topicError = false;

  if (board && !restricted) {
    const { data, error } = await supabase
      .from("forum_topics")
      .select("id, slug, title, excerpt, last_activity_at, tags, is_pinned")
      .eq("board_id", board.id)
      .order("is_pinned", { ascending: false })
      .order("last_activity_at", { ascending: false })
      .limit(8);

    topics = (data ?? []) as GuideTopic[];
    topicError = Boolean(error);
  }

  const boardHref = board ? `/forum/${board.slug}` : "/forum/guide-du-roliste";
  const loginHref = `/connexion?message=connexion-requise&retour=${encodeURIComponent(boardHref)}`;

  return (
    <main className="site-shell guides-page">
      <SiteHeader />

      <section className="guides-hero">
        <div className="content-frame guides-hero__content">
          <p className="eyebrow">Bibliothèque communautaire</p>
          <h1>Guides</h1>
          <p className="guides-hero__intro">
            Les ressources utiles pour jouer, écrire et participer à Imetheran. Les contenus vivent dans le forum afin de rester discutables, corrigibles et à jour par la communauté.
          </p>
          <div className="guides-hero__actions">
            <Link className="button button--primary" href={boardHref}>Ouvrir le Guide du Rôliste</Link>
            <Link className="button button--ghost" href="/personnages">Voir les personnages</Link>
          </div>
        </div>
      </section>

      <section className="content-frame guides-orientation" aria-labelledby="guides-orientation-title">
        <div className="guides-section-heading">
          <div>
            <p className="eyebrow">Par où commencer ?</p>
            <h2 id="guides-orientation-title">Trois portes d’entrée</h2>
          </div>
          <p>Pas de faux articles préremplis : ces rubriques orientent vers les ressources réellement publiées par les membres.</p>
        </div>

        <div className="guides-paths">
          {guidePaths.map((path) => (
            <article className="guides-path" key={path.marker}>
              <span className="guides-path__marker">{path.marker}</span>
              <h3>{path.title}</h3>
              <p>{path.description}</p>
              <Link className="text-link" href={boardHref}>Consulter les sujets →</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="guides-live" aria-labelledby="guides-live-title">
        <div className="content-frame">
          <div className="guides-section-heading guides-section-heading--live">
            <div>
              <p className="eyebrow">Depuis le forum</p>
              <h2 id="guides-live-title">Guide du Rôliste</h2>
            </div>
            <Link className="button button--ghost button--small" href={boardHref}>Voir tout le forum</Link>
          </div>

          {boardError || !board ? (
            <div className="guides-notice">
              <span aria-hidden="true">!</span>
              <div>
                <strong>Le guide ne peut pas être chargé pour le moment.</strong>
                <p>Le forum reste accessible directement pendant que la connexion est vérifiée.</p>
              </div>
            </div>
          ) : restricted ? (
            <div className="guides-gate">
              <div>
                <p className="eyebrow">Accès membre</p>
                <h3>Les guides détaillés sont dans l’espace communautaire</h3>
                <p>{board.description}</p>
              </div>
              <Link className="button button--primary" href={loginHref}>Connexion / inscription</Link>
            </div>
          ) : topicError ? (
            <div className="guides-notice">
              <span aria-hidden="true">!</span>
              <div>
                <strong>Les sujets n’ont pas pu être chargés.</strong>
                <p>Vous pouvez toujours ouvrir le forum pour réessayer.</p>
              </div>
            </div>
          ) : topics.length > 0 ? (
            <div className="guides-topic-list">
              {topics.map((topic) => (
                <Link className="guides-topic" href={`${boardHref}/sujet/${topic.slug}`} key={topic.id}>
                  <div className="guides-topic__body">
                    <div className="guides-topic__meta">
                      {topic.is_pinned ? <span className="status-pill">Épinglé</span> : null}
                      <span>Mis à jour le {formatDate(topic.last_activity_at)}</span>
                    </div>
                    <h3>{topic.title}</h3>
                    <p>{topic.excerpt}</p>
                    {Array.isArray(topic.tags) && topic.tags.length > 0 ? (
                      <div className="guides-topic__tags">
                        {topic.tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}
                      </div>
                    ) : null}
                  </div>
                  <span className="guides-topic__arrow" aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="guides-empty">
              <p className="eyebrow">Bibliothèque ouverte</p>
              <h3>Aucun guide publié pour le moment</h3>
              <p>Les premiers sujets apparaîtront ici automatiquement dès leur publication dans le Guide du Rôliste.</p>
              <Link className="button button--primary button--small" href={`${boardHref}/nouveau`}>Proposer un guide</Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
