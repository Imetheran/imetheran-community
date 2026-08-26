import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function getRole(appMetadata: unknown) {
  if (!appMetadata || typeof appMetadata !== "object" || !("role" in appMetadata)) return "member";
  return String((appMetadata as { role?: unknown }).role ?? "member");
}

function formatDate(value: string | null, withTime = false) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" as const } : {}),
    timeZone: "Europe/Paris",
  }).format(new Date(value));
}

function topicStatusLabel(status: string) {
  if (status === "finished") return "Terminé";
  if (status === "archived") return "Archivé";
  if (status === "closed") return "Fermé";
  return "Ouvert";
}

function accessLabel(access: string) {
  return access === "guest-read" ? "Invités" : "Membres";
}

export default async function AdministrationPage() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (claimsError || !claims || typeof claims.sub !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fadministration");
  }

  const role = getRole(claims.app_metadata);
  if (role !== "admin") {
    redirect("/compte");
  }

  const [
    membersResult,
    charactersResult,
    topicsResult,
    postsResult,
    sectionsResult,
    boardsResult,
    recentProfilesResult,
    recentTopicsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("characters").select("id", { count: "exact", head: true }),
    supabase.from("forum_topics").select("id", { count: "exact", head: true }),
    supabase.from("forum_posts").select("id", { count: "exact", head: true }),
    supabase
      .from("forum_sections")
      .select("id, title, mode, access_scope, is_active, sort_order", { count: "exact" })
      .order("sort_order"),
    supabase
      .from("forum_boards")
      .select("id, title, slug, is_active", { count: "exact" })
      .order("sort_order"),
    supabase
      .from("profiles")
      .select("id, display_name, username, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("forum_topics")
      .select("id, board_id, title, slug, status, is_pinned, is_locked, last_activity_at, post_count")
      .order("last_activity_at", { ascending: false })
      .limit(8),
  ]);

  const loadErrors = [
    membersResult.error,
    charactersResult.error,
    topicsResult.error,
    postsResult.error,
    sectionsResult.error,
    boardsResult.error,
    recentProfilesResult.error,
    recentTopicsResult.error,
  ].filter(Boolean);

  const membersCount = membersResult.count ?? 0;
  const charactersCount = charactersResult.count ?? 0;
  const topicsCount = topicsResult.count ?? 0;
  const postsCount = postsResult.count ?? 0;
  const sections = sectionsResult.data ?? [];
  const boards = boardsResult.data ?? [];
  const boardMap = new Map(boards.map((board) => [board.id, board]));
  const activeSections = sections.filter((section) => section.is_active).length;
  const activeBoards = boards.filter((board) => board.is_active).length;
  const recentProfiles = recentProfilesResult.data ?? [];
  const recentTopics = recentTopicsResult.data ?? [];
  const backendHealthy = loadErrors.length === 0;

  return (
    <main className="site-shell admin-page">
      <SiteHeader />

      <section className="admin-hero">
        <div className="content-frame admin-hero__layout">
          <div>
            <p className="eyebrow">Administration</p>
            <h1>Tableau de bord</h1>
            <p>
              Pilotez la communauté et le forum depuis les données réelles d’Imetheran. Les modules éditoriaux
              rejoindront ce même espace à mesure de leur connexion à Supabase.
            </p>
          </div>
          <div className="admin-hero__side">
            <span className="admin-role-badge"><span aria-hidden="true">✦</span> Administrateur</span>
            <Link className="button button--ghost button--small" href="/">Voir le site</Link>
          </div>
        </div>
      </section>

      <section className="content-frame admin-workspace">
        {!backendHealthy ? (
          <div className="admin-alert" role="alert">
            <strong>Certaines données n’ont pas pu être chargées.</strong>
            <span>Le panneau reste accessible, mais vérifiez Supabase avant toute opération importante.</span>
          </div>
        ) : null}

        <div className="admin-metrics" aria-label="Indicateurs communautaires">
          <article className="admin-metric">
            <span>01</span>
            <div><strong>{membersCount}</strong><small>Membres</small></div>
          </article>
          <article className="admin-metric">
            <span>02</span>
            <div><strong>{charactersCount}</strong><small>Personnages en base</small></div>
          </article>
          <article className="admin-metric">
            <span>03</span>
            <div><strong>{topicsCount}</strong><small>Sujets</small></div>
          </article>
          <article className="admin-metric">
            <span>04</span>
            <div><strong>{postsCount}</strong><small>Messages</small></div>
          </article>
        </div>

        <nav className="admin-quick-actions" aria-label="Actions rapides">
          <Link href="/forum/annonces-informations/nouveau">
            <span aria-hidden="true">＋</span>
            <div><strong>Nouvelle annonce</strong><small>Publier dans Annonces & Informations</small></div>
          </Link>
          <Link href="/forum">
            <span aria-hidden="true">◇</span>
            <div><strong>Modérer le forum</strong><small>Ouvrir les espaces et sujets réels</small></div>
          </Link>
          <Link href="/compte">
            <span aria-hidden="true">◎</span>
            <div><strong>Mon compte</strong><small>Profil et session administrateur</small></div>
          </Link>
        </nav>

        <div className="admin-dashboard-grid">
          <section className="admin-panel admin-panel--wide" aria-labelledby="admin-forum-title">
            <header className="admin-panel__head">
              <div>
                <p className="eyebrow">Activité</p>
                <h2 id="admin-forum-title">Forum</h2>
              </div>
              <Link className="text-link" href="/forum">Voir tout →</Link>
            </header>

            {recentTopics.length > 0 ? (
              <div className="admin-topic-list">
                {recentTopics.map((topic) => {
                  const board = boardMap.get(topic.board_id);
                  const topicHref = board ? `/forum/${board.slug}/sujet/${topic.slug}` : "/forum";
                  return (
                    <Link className="admin-topic-row" href={topicHref} key={topic.id}>
                      <div className="admin-topic-row__main">
                        <div className="admin-topic-row__badges">
                          <span>{topicStatusLabel(topic.status)}</span>
                          {topic.is_pinned ? <span>Épinglé</span> : null}
                          {topic.is_locked ? <span>Verrouillé</span> : null}
                        </div>
                        <strong>{topic.title}</strong>
                        <small>{board?.title ?? "Forum"}</small>
                      </div>
                      <div className="admin-topic-row__meta">
                        <strong>{topic.post_count}</strong>
                        <small>message{topic.post_count > 1 ? "s" : ""}</small>
                      </div>
                      <time dateTime={topic.last_activity_at}>{formatDate(topic.last_activity_at, true)}</time>
                      <span className="admin-topic-row__arrow" aria-hidden="true">→</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="admin-empty-state">
                <strong>Aucun sujet pour le moment.</strong>
                <p>Le premier sujet publié apparaîtra ici automatiquement.</p>
              </div>
            )}
          </section>

          <aside className="admin-panel" aria-labelledby="admin-members-title">
            <header className="admin-panel__head">
              <div>
                <p className="eyebrow">Communauté</p>
                <h2 id="admin-members-title">Derniers membres</h2>
              </div>
            </header>

            <div className="admin-member-list">
              {recentProfiles.map((profile) => (
                <div className="admin-member-row" key={profile.id}>
                  <span aria-hidden="true">{profile.display_name.slice(0, 1).toUpperCase()}</span>
                  <div>
                    <strong>{profile.display_name}</strong>
                    <small>{profile.username ? `@${profile.username}` : "Identifiant non défini"}</small>
                  </div>
                  <time dateTime={profile.created_at}>{formatDate(profile.created_at)}</time>
                </div>
              ))}
            </div>

            <div className="admin-panel__note">
              <strong>Gestion des rôles</strong>
              <p>La consultation est active. La promotion, suspension et modération des comptes seront ajoutées dans le module Membres dédié.</p>
            </div>
          </aside>
        </div>

        <div className="admin-dashboard-grid admin-dashboard-grid--lower">
          <section className="admin-panel admin-panel--wide" aria-labelledby="admin-content-title">
            <header className="admin-panel__head">
              <div>
                <p className="eyebrow">CMS</p>
                <h2 id="admin-content-title">Contenus du site</h2>
              </div>
              <span className="admin-panel__status">Connexion progressive</span>
            </header>

            <div className="admin-content-grid">
              <Link href="/gazettes">
                <span className="admin-content-grid__index">01</span>
                <strong>Gazettes</strong>
                <p>Numéros, blocs éditoriaux, couverture et mise en avant.</p>
                <small>Prototype éditorial · à connecter</small>
              </Link>
              <Link href="/chroniques">
                <span className="admin-content-grid__index">02</span>
                <strong>Chroniques</strong>
                <p>Intrigues, actes, participants et progression narrative.</p>
                <small>Prototype éditorial · à connecter</small>
              </Link>
              <Link href="/guides">
                <span className="admin-content-grid__index">03</span>
                <strong>Guides</strong>
                <p>Publications pérennes issues de la communauté et du forum.</p>
                <small>Rubrique publique · à connecter</small>
              </Link>
              <Link href="/personnages">
                <span className="admin-content-grid__index">04</span>
                <strong>Personnages</strong>
                <p>Fiches membres, visibilité, portraits et futures relations.</p>
                <small>{charactersCount} personnage{charactersCount > 1 ? "s" : ""} en base · schéma prêt</small>
              </Link>
            </div>
          </section>

          <aside className="admin-panel" aria-labelledby="admin-structure-title">
            <header className="admin-panel__head">
              <div>
                <p className="eyebrow">Architecture</p>
                <h2 id="admin-structure-title">Structure du forum</h2>
              </div>
            </header>

            <div className="admin-structure-summary">
              <div><strong>{activeSections}</strong><small>catégories actives</small></div>
              <div><strong>{activeBoards}</strong><small>forums actifs</small></div>
            </div>

            <div className="admin-section-list">
              {sections.map((section) => (
                <div key={section.id}>
                  <span className={`admin-section-list__state${section.is_active ? "" : " admin-section-list__state--off"}`} aria-hidden="true" />
                  <div><strong>{section.title}</strong><small>{section.mode === "rp" ? "RP" : "Hors-RP"} · {accessLabel(section.access_scope)}</small></div>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <section className="admin-system" aria-labelledby="admin-system-title">
          <div>
            <p className="eyebrow">État du socle</p>
            <h2 id="admin-system-title">Système</h2>
          </div>
          <div className="admin-system__items">
            <span><i className={backendHealthy ? "is-ok" : "is-warn"} />Supabase<strong>{backendHealthy ? "Connecté" : "À vérifier"}</strong></span>
            <span><i className="is-ok" />Authentification<strong>Active</strong></span>
            <span><i className="is-ok" />RLS forum<strong>Active</strong></span>
            <span><i className="is-pending" />CMS éditorial<strong>À brancher</strong></span>
          </div>
        </section>
      </section>
    </main>
  );
}
