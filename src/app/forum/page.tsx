import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SectionKind = "community" | "universe" | "chronicles" | "campaign" | "game";

const presentation: Record<string, { kind: SectionKind; eyebrow: string }> = {
  communaute: { kind: "community", eyebrow: "Vie communautaire" },
  "univers-roleplay": { kind: "universe", eyebrow: "Préparer le jeu" },
  chroniques: { kind: "chronicles", eyebrow: "Rôleplay communautaire" },
  evercold: { kind: "campaign", eyebrow: "Campagne RP en cours" },
  "final-fantasy-xiv": { kind: "game", eyebrow: "Autour du jeu" },
};

function BoardIcon({ kind }: { kind: SectionKind }) {
  return (
    <span className={`forum-board__icon forum-board__icon--${kind}`} aria-hidden="true">
      <svg viewBox="0 0 40 40">
        <path d="M7 9.5h26v18H18l-7.5 5v-5H7z" />
        <path d="M12 15h16M12 20h11" />
      </svg>
    </span>
  );
}

function accessLabel(access: string) {
  return access === "guest-read" ? "Lecture invités" : "Membres uniquement";
}

function formatActivity(value: string | null) {
  if (!value) return "Aucune activité";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(value));
}

export default async function ForumPage() {
  const supabase = await createClient();
  const [{ data: sectionRows, error: sectionError }, { data: topicRows, error: topicError }] = await Promise.all([
    supabase
      .from("forum_sections")
      .select(`
        id,
        slug,
        title,
        subtitle,
        mode,
        access_scope,
        sort_order,
        forum_boards (
          id,
          slug,
          title,
          description,
          badge,
          sort_order,
          is_active
        )
      `)
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("forum_topics")
      .select("board_id, post_count, last_activity_at"),
  ]);

  const sections = (sectionRows ?? [])
    .map((section) => ({
      ...section,
      forum_boards: [...(section.forum_boards ?? [])]
        .filter((board) => board.is_active)
        .sort((a, b) => a.sort_order - b.sort_order),
    }))
    .sort((a, b) => a.sort_order - b.sort_order);

  const topicStats = new Map<string, { topics: number; posts: number; lastActivity: string | null }>();
  for (const topic of topicRows ?? []) {
    const previous = topicStats.get(topic.board_id) ?? { topics: 0, posts: 0, lastActivity: null };
    previous.topics += 1;
    previous.posts += topic.post_count;
    if (!previous.lastActivity || topic.last_activity_at > previous.lastActivity) {
      previous.lastActivity = topic.last_activity_at;
    }
    topicStats.set(topic.board_id, previous);
  }

  const boardCount = sections.reduce((total, section) => total + section.forum_boards.length, 0);
  const visibleTopicCount = topicRows?.length ?? 0;
  const loadError = sectionError || topicError;

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
            Le cœur des échanges d’Imetheran : espaces communautaires hors-RP, préparation du jeu,
            scènes rôleplay, campagnes saisonnières et discussions autour de Final Fantasy XIV.
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
              Parcourez les discussions publiques, les espaces réservés aux membres et les différentes zones dédiées au rôleplay.
            </p>
          </div>
          <div className="forum-index__summary" aria-label="Résumé du forum">
            <span><strong>{sections.length}</strong> catégories</span>
            <span><strong>{boardCount}</strong> forums</span>
            <span><strong>{visibleTopicCount}</strong> sujets visibles</span>
          </div>
        </header>

        {loadError ? (
          <div className="forum-index__notice">
            <div>
              <span className="forum-index__notice-mark" aria-hidden="true">!</span>
              <div>
                <strong>Le forum est momentanément indisponible</strong>
                <p>Une partie des espaces n’a pas pu être chargée. Réessayez dans quelques instants.</p>
              </div>
            </div>
            <span className="status-pill status-pill--quiet">Indisponible</span>
          </div>
        ) : null}

        <div className="forum-sections">
          {sections.map((section, sectionIndex) => {
            const style = presentation[section.slug] ?? { kind: "community" as const, eyebrow: "Forum" };
            return (
              <section className={`forum-section forum-section--${style.kind}`} key={section.id}>
                <header className="forum-section__header">
                  <div className="forum-section__identity">
                    <span className="forum-section__number">{String(sectionIndex + 1).padStart(2, "0")}</span>
                    <div>
                      <p>{style.eyebrow}</p>
                      <h2>{section.title}</h2>
                    </div>
                  </div>
                  <p className="forum-section__subtitle">{section.subtitle}</p>
                  <div className="forum-section__meta" aria-label="Nature et accès de la catégorie">
                    <span className={`forum-section__mode forum-section__mode--${section.mode}`}>{section.mode === "rp" ? "RP" : "Hors-RP"}</span>
                    <span className={`forum-section__access forum-section__access--${section.access_scope}`}>{accessLabel(section.access_scope)}</span>
                    {style.kind === "campaign" ? <span className="status-pill">Campagne active</span> : null}
                  </div>
                </header>

                <div className="forum-board-list">
                  {section.forum_boards.map((board) => {
                    const stats = topicStats.get(board.id) ?? { topics: 0, posts: 0, lastActivity: null };
                    return (
                      <Link className="forum-board" href={`/forum/${board.slug}`} key={board.id}>
                        <BoardIcon kind={style.kind} />
                        <div className="forum-board__main">
                          <div className="forum-board__title-row">
                            <h3>{board.title}</h3>
                            {board.badge ? <span className="forum-board__badge">{board.badge}</span> : null}
                          </div>
                          <p>{board.description}</p>
                        </div>
                        <div className="forum-board__stats" aria-label={`Statistiques de ${board.title}`}>
                          <span><strong>{stats.topics}</strong><small>Sujets</small></span>
                          <span><strong>{stats.posts}</strong><small>Messages</small></span>
                        </div>
                        <div className="forum-board__last">
                          <small>Dernière activité</small>
                          <strong>{formatActivity(stats.lastActivity)}</strong>
                          <span>{section.access_scope === "members" ? "Accès membre" : "Lecture publique"}</span>
                        </div>
                        <span className="forum-board__arrow" aria-hidden="true">→</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <footer className="forum-index__footer">
          <div>
            <p className="eyebrow">Faire vivre la communauté</p>
            <strong>Les espaces du forum évolueront avec les histoires, campagnes et besoins des membres d’Imetheran.</strong>
          </div>
          <Link className="text-link" href="/">← Retour à l’accueil</Link>
        </footer>
      </section>
    </main>
  );
}
