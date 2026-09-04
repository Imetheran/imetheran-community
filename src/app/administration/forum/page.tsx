import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import { ReportList } from "./report-list";
import { TopicList } from "./topic-list";
import { PostList } from "./post-list";
import { HistoryList } from "./history-list";
import { buildReturnTo, reasonLabel, roleFromMetadata } from "./utils";
import type { BoardRow, EventRow, ForumMaps, PostRow, ReportRow, TopicRow, ViewName } from "./types";
import styles from "./forum-admin.module.css";

export const dynamic = "force-dynamic";

type Search = { vue?: string; statut?: string; forum?: string; q?: string; message?: string; erreur?: string };

const reportPriority: Record<string, number> = { open: 0, in_review: 1, resolved: 2, dismissed: 3 };

function searchPlaceholder(view: ViewName) {
  if (view === "reports") return "Sujet, motif, membre…";
  if (view === "topics") return "Titre ou auteur…";
  if (view === "posts") return "Contenu, sujet ou auteur…";
  return "Action, sujet ou membre…";
}

export default async function ForumAdministrationPage({ searchParams }: { searchParams: Promise<Search> }) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (claimsError || !claims || typeof claims.sub !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fadministration%2Fforum");
  }

  const role = roleFromMetadata(claims.app_metadata);
  if (role !== "admin" && role !== "moderator") redirect("/compte");

  const rawView = query.vue ?? "reports";
  const view: ViewName = ["reports", "topics", "posts", "history"].includes(rawView) ? rawView as ViewName : "reports";
  const statusFilter = String(query.statut ?? "").trim();
  const boardFilter = String(query.forum ?? "").trim();
  const search = String(query.q ?? "").trim().slice(0, 120);
  const needle = search.toLocaleLowerCase("fr");

  const [boardsResult, topicsCount, openReports, reviewReports, hiddenPosts, topicsResult, postsResult, reportsResult, eventsResult] = await Promise.all([
    supabase.from("forum_boards").select("id, slug, title, is_active, forum_sections!inner(title, mode, is_active)").order("sort_order"),
    supabase.from("forum_topics").select("id", { count: "exact", head: true }),
    supabase.from("forum_reports").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("forum_reports").select("id", { count: "exact", head: true }).eq("status", "in_review"),
    supabase.from("forum_posts").select("id", { count: "exact", head: true }).eq("is_hidden", true),
    supabase.from("forum_topics").select("id, board_id, author_id, slug, title, status, is_pinned, is_locked, post_count, last_activity_at").order("last_activity_at", { ascending: false }).limit(250),
    supabase.from("forum_posts").select("id, topic_id, author_id, content, created_at, edited_at, is_hidden, hidden_at, hidden_by").order("created_at", { ascending: false }).limit(250),
    supabase.from("forum_reports").select("id, reporter_id, topic_id, post_id, reason, details, status, handled_by, resolution_note, created_at, updated_at, resolved_at").order("created_at", { ascending: false }).limit(150),
    supabase.from("forum_moderation_events").select("id, actor_user_id, target_type, topic_id, post_id, report_id, action, details, created_at").order("created_at", { ascending: false }).limit(200),
  ]);

  const boards = (boardsResult.data ?? []) as BoardRow[];
  const topics = (topicsResult.data ?? []) as TopicRow[];
  const posts = (postsResult.data ?? []) as PostRow[];
  const reports = (reportsResult.data ?? []) as ReportRow[];
  const events = (eventsResult.data ?? []) as EventRow[];
  const boardMap = new Map(boards.map((board) => [board.id, board]));
  const topicMap = new Map(topics.map((topic) => [topic.id, topic]));
  const postMap = new Map(posts.map((post) => [post.id, post]));

  const profileIds = Array.from(new Set([
    ...topics.map((topic) => topic.author_id),
    ...posts.map((post) => post.author_id),
    ...reports.map((report) => report.reporter_id),
    ...reports.map((report) => report.handled_by),
    ...events.map((event) => event.actor_user_id),
  ].filter((id): id is string => typeof id === "string" && id.length > 0)));
  const profileMap = new Map<string, string>();
  if (profileIds.length) {
    const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", profileIds);
    for (const profile of profiles ?? []) profileMap.set(profile.id, profile.display_name);
  }

  const validBoard = boardMap.has(boardFilter) ? boardFilter : "";
  const filteredTopics = topics.filter((topic) => (!validBoard || topic.board_id === validBoard) && (!statusFilter || topic.status === statusFilter) && (!needle || `${topic.title} ${topic.author_id ? profileMap.get(topic.author_id) ?? "" : "Compte supprimé"}`.toLocaleLowerCase("fr").includes(needle)));
  const filteredPosts = posts.filter((post) => {
    const topic = topicMap.get(post.topic_id);
    return (!validBoard || topic?.board_id === validBoard)
      && (statusFilter !== "hidden" || post.is_hidden)
      && (statusFilter !== "visible" || !post.is_hidden)
      && (!needle || `${post.content} ${topic?.title ?? ""} ${post.author_id ? profileMap.get(post.author_id) ?? "" : "Compte supprimé"}`.toLocaleLowerCase("fr").includes(needle));
  }).sort((a, b) => Number(b.is_hidden) - Number(a.is_hidden));
  const filteredReports = reports.filter((report) => {
    const topic = topicMap.get(report.topic_id);
    return (!validBoard || topic?.board_id === validBoard)
      && (!statusFilter || report.status === statusFilter)
      && (!needle || `${report.details} ${reasonLabel(report.reason)} ${topic?.title ?? ""} ${profileMap.get(report.reporter_id) ?? ""}`.toLocaleLowerCase("fr").includes(needle));
  }).sort((a, b) => (reportPriority[a.status] ?? 99) - (reportPriority[b.status] ?? 99) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const filteredEvents = events.filter((event) => {
    const topic = event.topic_id ? topicMap.get(event.topic_id) : null;
    return (!validBoard || topic?.board_id === validBoard)
      && (!needle || `${event.action} ${topic?.title ?? ""} ${profileMap.get(event.actor_user_id ?? "") ?? ""}`.toLocaleLowerCase("fr").includes(needle));
  });

  const maps: ForumMaps = { boards, boardMap, topicMap, postMap, profileMap };
  const returnTo = buildReturnTo(view, statusFilter, validBoard, search);
  const loadError = boardsResult.error || topicsResult.error || postsResult.error || reportsResult.error || eventsResult.error;
  const successMessage: Record<string, string> = { sujet: "Modération du sujet enregistrée.", deplace: "Sujet déplacé.", masque: "Message masqué aux membres.", restaure: "Message restauré.", signalement: "Signalement mis à jour." };
  const attentionCount = (openReports.count ?? 0) + (reviewReports.count ?? 0);
  const resultCount = view === "reports" ? filteredReports.length : view === "topics" ? filteredTopics.length : view === "posts" ? filteredPosts.length : filteredEvents.length;

  return (
    <main className="site-shell admin-page">
      <SiteHeader />
      <section className="admin-hero">
        <div className="content-frame admin-hero__layout">
          <div><p className="eyebrow">Administration · Forum</p><h1>Centre de modération</h1><p>Traitez les signalements, gérez les sujets et masquez un message sans détruire l’historique.</p></div>
          <div className="admin-hero__side">
            <span className="admin-role-badge"><span aria-hidden="true">✦</span> {role === "admin" ? "Administrateur" : "Modérateur"}</span>
            {role === "admin" ? <Link className="button button--ghost button--small" href="/administration/forum/structure">Structure du forum</Link> : null}
            <Link className="button button--ghost button--small" href="/forum">Voir le forum</Link>
          </div>
        </div>
      </section>

      <section className={`content-frame admin-workspace ${styles.workspace}`}>
        {loadError ? <div className="admin-alert" role="alert"><strong>Données partielles</strong><span>Une partie du centre n’a pas pu être chargée.</span></div> : null}
        {query.message && successMessage[query.message] ? <div className={styles.notice} role="status">{successMessage[query.message]}</div> : null}
        {query.erreur ? <div className={`${styles.notice} ${styles.noticeError}`} role="alert">{query.erreur === "deplacement" ? "Le sujet n’a pas pu être déplacé. Vérifiez la compatibilité RP du forum cible." : "L’action de modération n’a pas pu être enregistrée."}</div> : null}

        <div className={styles.metrics}>
          <article><span>Signalements ouverts</span><strong>{openReports.count ?? 0}</strong></article>
          <article><span>En cours</span><strong>{reviewReports.count ?? 0}</strong></article>
          <article><span>Messages masqués</span><strong>{hiddenPosts.count ?? 0}</strong></article>
          <article><span>Sujets</span><strong>{topicsCount.count ?? 0}</strong></article>
        </div>

        <section className={`${styles.priority} ${attentionCount ? styles.priorityActive : ""}`} aria-label="Priorité de modération">
          <div><span aria-hidden="true">{attentionCount ? "!" : "✓"}</span><div><strong>{attentionCount ? `${attentionCount} signalement${attentionCount > 1 ? "s" : ""} à traiter` : "Aucun signalement en attente"}</strong><small>{attentionCount ? "Les signalements ouverts et en cours apparaissent en premier." : "La file active est à jour."}</small></div></div>
          {attentionCount ? <Link href="/administration/forum?vue=reports&statut=open">Voir les ouverts →</Link> : null}
        </section>

        <nav className={styles.tabs} aria-label="Sections de modération">
          <Link className={view === "reports" ? styles.active : ""} href="/administration/forum?vue=reports">Signalements <span>{attentionCount}</span></Link>
          <Link className={view === "topics" ? styles.active : ""} href="/administration/forum?vue=topics">Sujets <span>{topicsCount.count ?? 0}</span></Link>
          <Link className={view === "posts" ? styles.active : ""} href="/administration/forum?vue=posts">Messages <span>{hiddenPosts.count ?? 0}</span></Link>
          <Link className={view === "history" ? styles.active : ""} href="/administration/forum?vue=history">Journal</Link>
        </nav>

        <form className={styles.filters} method="get">
          <input type="hidden" name="vue" value={view} />
          <label><span>Recherche</span><input name="q" type="search" defaultValue={search} placeholder={searchPlaceholder(view)} /></label>
          <label><span>Forum</span><select name="forum" defaultValue={validBoard}><option value="">Tous les forums</option>{boards.map((board) => <option value={board.id} key={board.id}>{board.title}</option>)}</select></label>
          {view === "reports" ? <label><span>Statut</span><select name="statut" defaultValue={statusFilter}><option value="">Tous</option><option value="open">Ouverts</option><option value="in_review">En cours</option><option value="resolved">Résolus</option><option value="dismissed">Classés</option></select></label> : null}
          {view === "topics" ? <label><span>Statut</span><select name="statut" defaultValue={statusFilter}><option value="">Tous</option><option value="open">Ouverts</option><option value="finished">Terminés</option><option value="archived">Archivés</option></select></label> : null}
          {view === "posts" ? <label><span>Visibilité</span><select name="statut" defaultValue={statusFilter}><option value="">Tous</option><option value="visible">Visibles</option><option value="hidden">Masqués</option></select></label> : null}
          <button className="button button--ghost button--small" type="submit">Filtrer</button>
          {(search || validBoard || statusFilter) ? <Link className="text-link" href={`/administration/forum?vue=${view}`}>Réinitialiser</Link> : null}
        </form>

        <div className={styles.resultSummary}><strong>{resultCount}</strong><span>élément{resultCount > 1 ? "s" : ""} dans cette vue</span>{search || validBoard || statusFilter ? <small>Filtres actifs</small> : null}</div>

        {view === "reports" ? <ReportList reports={filteredReports} maps={maps} returnTo={returnTo} /> : null}
        {view === "topics" ? <TopicList topics={filteredTopics} maps={maps} returnTo={returnTo} /> : null}
        {view === "posts" ? <PostList posts={filteredPosts} maps={maps} returnTo={returnTo} /> : null}
        {view === "history" ? <HistoryList events={filteredEvents} maps={maps} /> : null}

        <p className={styles.limitNote}>Le centre charge les contenus récents par lots ; la pagination sera utile seulement lorsque le volume réel l’exigera.</p>
      </section>
    </main>
  );
}
