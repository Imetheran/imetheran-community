import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { readSiteRuntimeSettings } from "@/lib/site-runtime";
import { createClient } from "@/lib/supabase/server";
import { setMaintenanceMode } from "./actions";

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

export default async function AdministrationPage({
  searchParams,
}: {
  searchParams: Promise<{ etat?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (claimsError || !claims || typeof claims.sub !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fadministration");
  }
  if (getRole(claims.app_metadata) !== "admin") redirect("/compte");

  const [
    runtimeSettings,
    membersResult,
    charactersResult,
    topicsResult,
    postsResult,
    chroniclesResult,
    publishedChroniclesResult,
    gazettesResult,
    publishedGazettesResult,
    sectionsResult,
    boardsResult,
    recentProfilesResult,
    recentTopicsResult,
  ] = await Promise.all([
    readSiteRuntimeSettings(),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("characters").select("id", { count: "exact", head: true }),
    supabase.from("forum_topics").select("id", { count: "exact", head: true }),
    supabase.from("forum_posts").select("id", { count: "exact", head: true }),
    supabase.from("chronicles").select("id", { count: "exact", head: true }),
    supabase.from("chronicles").select("id", { count: "exact", head: true }).eq("publication_status", "published"),
    supabase.from("gazettes").select("id", { count: "exact", head: true }),
    supabase.from("gazettes").select("id", { count: "exact", head: true }).eq("publication_status", "published"),
    supabase.from("forum_sections").select("id, is_active", { count: "exact" }),
    supabase.from("forum_boards").select("id, title, slug, is_active", { count: "exact" }).order("sort_order"),
    supabase.from("profiles").select("id, display_name, username, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("forum_topics").select("id, board_id, title, slug, status, is_pinned, is_locked, last_activity_at, post_count").order("last_activity_at", { ascending: false }).limit(6),
  ]);

  const loadErrors = [
    membersResult.error,
    charactersResult.error,
    topicsResult.error,
    postsResult.error,
    chroniclesResult.error,
    publishedChroniclesResult.error,
    gazettesResult.error,
    publishedGazettesResult.error,
    sectionsResult.error,
    boardsResult.error,
    recentProfilesResult.error,
    recentTopicsResult.error,
  ].filter(Boolean);

  const membersCount = membersResult.count ?? 0;
  const charactersCount = charactersResult.count ?? 0;
  const topicsCount = topicsResult.count ?? 0;
  const postsCount = postsResult.count ?? 0;
  const chroniclesCount = chroniclesResult.count ?? 0;
  const publishedChroniclesCount = publishedChroniclesResult.count ?? 0;
  const gazettesCount = gazettesResult.count ?? 0;
  const publishedGazettesCount = publishedGazettesResult.count ?? 0;
  const sections = sectionsResult.data ?? [];
  const boards = boardsResult.data ?? [];
  const boardMap = new Map(boards.map((board) => [board.id, board]));
  const activeSections = sections.filter((section) => section.is_active).length;
  const activeBoards = boards.filter((board) => board.is_active).length;
  const recentProfiles = recentProfilesResult.data ?? [];
  const recentTopics = recentTopicsResult.data ?? [];
  const backendHealthy = loadErrors.length === 0;
  const runtimeHealthy = runtimeSettings.source === "database";
  const maintenanceEnabled = runtimeSettings.maintenanceEnabled;

  const feedback =
    params.etat === "maintenance"
      ? { tone: "maintenance", title: "Mode maintenance activé", text: "Les visiteurs sont maintenant dirigés vers la page de maintenance." }
      : params.etat === "online"
        ? { tone: "online", title: "Site remis en ligne", text: "L’accès public normal à Imetheran est rétabli." }
        : params.etat === "erreur"
          ? { tone: "error", title: "Changement non appliqué", text: "L’état du site n’a pas pu être modifié. Vérifiez Supabase puis réessayez." }
          : null;

  return (
    <main className="site-shell admin-page">
      <SiteHeader />

      <section className="admin-hero admin-hero--clean">
        <div className="content-frame admin-hero__layout">
          <div>
            <p className="eyebrow">Administration · Imetheran</p>
            <h1>Centre de pilotage</h1>
            <p>Les outils essentiels pour suivre la communauté, gérer les contenus et contrôler l’accès public au site.</p>
          </div>

          <aside className={`admin-site-control ${maintenanceEnabled ? "is-maintenance" : "is-online"}`} aria-label="État public du site">
            <div className="admin-site-control__status">
              <span className="admin-site-control__dot" aria-hidden="true" />
              <div>
                <small>État du site</small>
                <strong>{maintenanceEnabled ? "Maintenance" : "En ligne"}</strong>
              </div>
            </div>

            <p>
              {maintenanceEnabled
                ? "Le public voit actuellement la page de maintenance. L’administration et la connexion restent accessibles."
                : "Le site est accessible normalement aux visiteurs et aux membres."}
            </p>

            <div className="admin-site-control__actions">
              <form action={setMaintenanceMode}>
                <input type="hidden" name="enabled" value={maintenanceEnabled ? "false" : "true"} />
                <button className="admin-site-control__button" type="submit">
                  {maintenanceEnabled ? "Remettre le site en ligne" : "Passer en maintenance"}
                </button>
              </form>
              <Link className="text-link" href="/maintenance" target="_blank" rel="noopener noreferrer">
                Voir la page maintenance ↗
              </Link>
            </div>

            <small>
              {runtimeHealthy ? `Réglage runtime · ${formatDate(runtimeSettings.updatedAt, true)}` : "Réglage de secours actif · Supabase à vérifier"}
            </small>
          </aside>
        </div>
      </section>

      <section className="content-frame admin-workspace">
        {feedback ? (
          <div className={`admin-feedback admin-feedback--${feedback.tone}`} role={feedback.tone === "error" ? "alert" : "status"}>
            <strong>{feedback.title}</strong>
            <span>{feedback.text}</span>
          </div>
        ) : null}

        {!backendHealthy ? (
          <div className="admin-alert" role="alert">
            <strong>Certaines données n’ont pas pu être chargées.</strong>
            <span>Le panneau reste accessible, mais vérifiez Supabase avant toute opération importante.</span>
          </div>
        ) : null}

        <div className="admin-metrics" aria-label="Indicateurs communautaires">
          <article className="admin-metric"><span>01</span><div><strong>{membersCount}</strong><small>Membres</small></div></article>
          <article className="admin-metric"><span>02</span><div><strong>{charactersCount}</strong><small>Personnages</small></div></article>
          <article className="admin-metric"><span>03</span><div><strong>{topicsCount}</strong><small>Sujets</small></div></article>
          <article className="admin-metric"><span>04</span><div><strong>{chroniclesCount}</strong><small>Chroniques</small></div></article>
          <article className="admin-metric"><span>05</span><div><strong>{gazettesCount}</strong><small>Gazettes</small></div></article>
        </div>

        <nav className="admin-quick-actions" aria-label="Actions rapides">
          <Link href="/administration/forum"><span aria-hidden="true">◇</span><div><strong>Forum</strong><small>Modération et structure</small></div></Link>
          <Link href="/administration/membres"><span aria-hidden="true">◎</span><div><strong>Membres</strong><small>Rôles et participation</small></div></Link>
          <Link href="/administration/chroniques/nouveau"><span aria-hidden="true">✦</span><div><strong>Nouvelle chronique</strong><small>Créer un dossier</small></div></Link>
          <Link href="/administration/gazettes/nouveau"><span aria-hidden="true">▤</span><div><strong>Nouvelle Gazette</strong><small>Préparer un numéro</small></div></Link>
        </nav>

        <div className="admin-dashboard-grid">
          <section className="admin-panel admin-panel--wide" aria-labelledby="admin-forum-title">
            <header className="admin-panel__head">
              <div><p className="eyebrow">Activité</p><h2 id="admin-forum-title">Forum</h2></div>
              <div className="admin-panel__head-actions">
                <span className="admin-panel__status">{topicsCount} sujets · {postsCount} messages</span>
                <Link className="text-link" href="/administration/forum">Modérer →</Link>
                <Link className="text-link" href="/administration/forum/structure">Structure →</Link>
              </div>
            </header>

            {recentTopics.length ? (
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
                      <div className="admin-topic-row__meta"><strong>{topic.post_count}</strong><small>message{topic.post_count > 1 ? "s" : ""}</small></div>
                      <time dateTime={topic.last_activity_at}>{formatDate(topic.last_activity_at, true)}</time>
                      <span className="admin-topic-row__arrow" aria-hidden="true">→</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="admin-empty-state"><strong>Aucun sujet pour le moment.</strong><p>Le premier sujet publié apparaîtra ici automatiquement.</p></div>
            )}
          </section>

          <aside className="admin-panel" aria-labelledby="admin-members-title">
            <header className="admin-panel__head">
              <div><p className="eyebrow">Communauté</p><h2 id="admin-members-title">Derniers membres</h2></div>
              <Link className="text-link" href="/administration/membres">Gérer →</Link>
            </header>
            <div className="admin-member-list">
              {recentProfiles.map((profile) => (
                <div className="admin-member-row" key={profile.id}>
                  <span aria-hidden="true">{profile.display_name.slice(0, 1).toUpperCase()}</span>
                  <div><strong>{profile.display_name}</strong><small>{profile.username ? `@${profile.username}` : "Identifiant non défini"}</small></div>
                  <time dateTime={profile.created_at}>{formatDate(profile.created_at)}</time>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <section className="admin-panel admin-panel--content" aria-labelledby="admin-content-title">
          <header className="admin-panel__head">
            <div><p className="eyebrow">Gestion</p><h2 id="admin-content-title">Contenus & communauté</h2></div>
            <span className="admin-panel__status">Accès direct aux modules</span>
          </header>
          <div className="admin-content-grid admin-content-grid--clean">
            <Link href="/administration/gazettes"><span className="admin-content-grid__index">01</span><strong>Gazettes</strong><p>Numéros, articles, couverture et publication.</p><small>{gazettesCount} numéro{gazettesCount > 1 ? "s" : ""} · {publishedGazettesCount} publié{publishedGazettesCount > 1 ? "s" : ""}</small></Link>
            <Link href="/administration/chroniques"><span className="admin-content-grid__index">02</span><strong>Chroniques</strong><p>Intrigues, actes, participants et publication.</p><small>{chroniclesCount} dossier{chroniclesCount > 1 ? "s" : ""} · {publishedChroniclesCount} publié{publishedChroniclesCount > 1 ? "s" : ""}</small></Link>
            <Link href="/administration/personnages"><span className="admin-content-grid__index">03</span><strong>Personnages</strong><p>Fiches, visibilité, portraits et modération.</p><small>{charactersCount} personnage{charactersCount > 1 ? "s" : ""}</small></Link>
            <Link href="/administration/liens"><span className="admin-content-grid__index">04</span><strong>Liens</strong><p>Ressources et liens utiles présentés à la communauté.</p><small>Module éditorial</small></Link>
          </div>
        </section>

        <section className="admin-system" aria-labelledby="admin-system-title">
          <div><p className="eyebrow">État du socle</p><h2 id="admin-system-title">Système</h2></div>
          <div className="admin-system__items">
            <span><i className={maintenanceEnabled ? "is-warn" : "is-ok"} />Site public<strong>{maintenanceEnabled ? "Maintenance" : "En ligne"}</strong></span>
            <span><i className={backendHealthy && runtimeHealthy ? "is-ok" : "is-warn"} />Supabase<strong>{backendHealthy && runtimeHealthy ? "Connecté" : "À vérifier"}</strong></span>
            <span><i className="is-ok" />Forum<strong>{activeSections} catégories · {activeBoards} forums</strong></span>
            <span><i className="is-ok" />CMS<strong>Chroniques + Gazettes</strong></span>
          </div>
        </section>
      </section>
    </main>
  );
}
