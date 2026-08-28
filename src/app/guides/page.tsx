import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Guides",
  description: "Premiers pas, charte, cadre rôleplay et guides communautaires d’Imetheran.",
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
    title: "Premiers pas",
    description:
      "Le parcours conseillé pour poser votre profil, vous présenter, découvrir les personnages et trouver votre premier échange.",
    href: "/guides/premiers-pas",
    action: "Commencer ici",
  },
  {
    marker: "02",
    title: "Charte communautaire",
    description:
      "Respect, consentement, vie privée, spoilers et modération : le cadre commun qui s’applique à tous les espaces d’Imetheran.",
    href: "/guides/charte",
    action: "Lire la charte",
  },
  {
    marker: "03",
    title: "Cadre rôleplay",
    description:
      "Séparation joueur/personnage, conflits, lore, consentement et rythme : les repères qui permettent de co-écrire sereinement.",
    href: "/guides/roleplay",
    action: "Voir les repères RP",
  },
] as const;

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
          <p className="eyebrow">Bienvenue dans la communauté</p>
          <h1>Guides</h1>
          <p className="guides-hero__intro">
            Commencez par les repères essentiels d’Imetheran, puis approfondissez avec les guides et discussions publiés par la communauté.
          </p>
          <div className="guides-hero__actions">
            <Link className="button button--primary" href="/guides/premiers-pas">Commencer le parcours</Link>
            <Link className="button button--ghost" href={boardHref}>Guide du Rôliste</Link>
          </div>
        </div>
      </section>

      <section className="content-frame guides-orientation" aria-labelledby="guides-orientation-title">
        <div className="guides-section-heading">
          <div>
            <p className="eyebrow">Repères permanents</p>
            <h2 id="guides-orientation-title">Trois lectures pour bien commencer</h2>
          </div>
          <p>Ces pages publiques posent le cadre commun. Elles restent accessibles même si vous n’avez pas encore créé de compte.</p>
        </div>

        <div className="guides-paths">
          {guidePaths.map((path) => (
            <article className="guides-path" key={path.marker}>
              <span className="guides-path__marker">{path.marker}</span>
              <h3>{path.title}</h3>
              <p>{path.description}</p>
              <Link className="text-link" href={path.href}>{path.action} →</Link>
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
                <p>Les repères permanents ci-dessus restent disponibles pendant que le forum se reconnecte.</p>
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
              <p className="eyebrow">Bibliothèque communautaire</p>
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
