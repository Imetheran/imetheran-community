import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { bbcodeExcerpt } from "@/lib/bbcode";
import { createClient } from "@/lib/supabase/server";
import { markAllForumRead } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mon activité",
};

type View = "non-lus" | "suivis" | "sujets" | "messages";

type TopicRow = {
  id: string;
  board_id: string;
  author_id: string;
  last_author_id: string | null;
  last_post_id: string | null;
  slug: string;
  title: string;
  excerpt: string;
  status: string;
  is_locked: boolean;
  last_activity_at: string;
  post_count: number | null;
};

type PostRow = {
  id: string;
  topic_id: string;
  content: string;
  created_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(value));
}

function statusLabel(topic: TopicRow) {
  if (topic.status === "archived") return "Archivé";
  if (topic.status === "finished") return "Terminé";
  if (topic.is_locked) return "Verrouillé";
  return null;
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string; message?: string; erreur?: string }>;
}) {
  const query = await searchParams;
  const requestedView = String(query.vue ?? "non-lus");
  const view: View = ["non-lus", "suivis", "sujets", "messages"].includes(requestedView)
    ? requestedView as View
    : "non-lus";

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Factivite");
  }

  const [topicsResult, readsResult, followsResult, postsResult] = await Promise.all([
    supabase
      .from("forum_topics")
      .select("id, board_id, author_id, last_author_id, last_post_id, slug, title, excerpt, status, is_locked, last_activity_at, post_count")
      .order("last_activity_at", { ascending: false })
      .limit(500),
    supabase
      .from("forum_topic_reads")
      .select("topic_id, last_read_at")
      .eq("user_id", userId)
      .limit(1000),
    supabase
      .from("forum_topic_follows")
      .select("topic_id")
      .eq("user_id", userId)
      .limit(1000),
    supabase
      .from("forum_posts")
      .select("id, topic_id, content, created_at")
      .eq("author_id", userId)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  const topics = (topicsResult.data ?? []) as TopicRow[];
  const myPosts = (postsResult.data ?? []) as PostRow[];
  const readMap = new Map((readsResult.data ?? []).map((row) => [row.topic_id, row.last_read_at]));
  const followedIds = new Set((followsResult.data ?? []).map((row) => row.topic_id));
  const topicMap = new Map(topics.map((topic) => [topic.id, topic]));

  const missingTopicIds = Array.from(new Set(myPosts.map((post) => post.topic_id))).filter((id) => !topicMap.has(id));
  if (missingTopicIds.length > 0) {
    const { data: extraTopics } = await supabase
      .from("forum_topics")
      .select("id, board_id, author_id, last_author_id, last_post_id, slug, title, excerpt, status, is_locked, last_activity_at, post_count")
      .in("id", missingTopicIds);
    for (const topic of (extraTopics ?? []) as TopicRow[]) topicMap.set(topic.id, topic);
  }

  const allTopics = Array.from(topicMap.values());
  const boardIds = Array.from(new Set(allTopics.map((topic) => topic.board_id)));
  const profileIds = Array.from(new Set(allTopics.flatMap((topic) => [topic.author_id, topic.last_author_id]).filter((id): id is string => Boolean(id))));

  const [boardsResult, profilesResult] = await Promise.all([
    boardIds.length
      ? supabase.from("forum_boards").select("id, slug, title").in("id", boardIds)
      : Promise.resolve({ data: [] as { id: string; slug: string; title: string }[] }),
    profileIds.length
      ? supabase.from("profiles").select("id, display_name").in("id", profileIds)
      : Promise.resolve({ data: [] as { id: string; display_name: string }[] }),
  ]);

  const boardMap = new Map((boardsResult.data ?? []).map((board) => [board.id, board]));
  const profileMap = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile.display_name]));

  const isUnread = (topic: TopicRow) => {
    const lastReadAt = readMap.get(topic.id);
    if (lastReadAt) return new Date(topic.last_activity_at).getTime() > new Date(lastReadAt).getTime();
    return (topic.last_author_id ?? topic.author_id) !== userId;
  };

  const unreadTopics = topics.filter(isUnread);
  const followedTopics = topics.filter((topic) => followedIds.has(topic.id));
  const ownTopics = topics.filter((topic) => topic.author_id === userId);

  const tabs: Array<{ key: View; label: string; count: number }> = [
    { key: "non-lus", label: "Non lus", count: unreadTopics.length },
    { key: "suivis", label: "Suivis", count: followedTopics.length },
    { key: "sujets", label: "Mes sujets", count: ownTopics.length },
    { key: "messages", label: "Mes messages", count: myPosts.length },
  ];

  const visibleTopics = view === "non-lus" ? unreadTopics : view === "suivis" ? followedTopics : ownTopics;

  return (
    <main className="site-shell member-activity-page">
      <SiteHeader />

      <section className="tools-hero member-activity-hero">
        <div className="content-frame tools-hero__layout">
          <div>
            <p className="eyebrow">Espace membre</p>
            <h1>Mon activité</h1>
          </div>
          <div className="tools-hero__side">
            {unreadTopics.length > 0 ? <span className="status-pill">{unreadTopics.length} non lu{unreadTopics.length > 1 ? "s" : ""}</span> : null}
          </div>
        </div>
      </section>

      <section className="content-frame member-activity-workspace">
        {query.message === "lus" ? <div className="tools-notice" role="status">Tous les sujets visibles ont été marqués comme lus.</div> : null}
        {query.erreur ? <div className="tools-notice tools-notice--error" role="alert">La lecture n’a pas pu être mise à jour.</div> : null}

        <div className="member-activity-toolbar">
          <nav className="member-activity-tabs" aria-label="Filtrer mon activité">
            {tabs.map((tab) => (
              <Link className={view === tab.key ? "is-current" : ""} href={`/activite?vue=${tab.key}`} key={tab.key}>
                {tab.label}<span>{tab.count}</span>
              </Link>
            ))}
          </nav>
          {unreadTopics.length > 0 ? (
            <form action={markAllForumRead}>
              <button className="button button--ghost button--small" type="submit">Tout marquer comme lu</button>
            </form>
          ) : null}
        </div>

        {view === "messages" ? (
          myPosts.length > 0 ? (
            <div className="member-activity-list">
              {myPosts.map((post) => {
                const topic = topicMap.get(post.topic_id);
                if (!topic) return null;
                const board = boardMap.get(topic.board_id);
                if (!board) return null;
                return (
                  <article className="member-activity-row" key={post.id}>
                    <div className="member-activity-row__main">
                      <div className="member-activity-row__meta"><span>{board.title}</span><time dateTime={post.created_at}>{formatDate(post.created_at)}</time></div>
                      <Link className="member-activity-row__title" href={`/forum/${board.slug}/sujet/${topic.slug}#${post.id}`}>{topic.title}</Link>
                      <p>{bbcodeExcerpt(post.content)}</p>
                    </div>
                    <Link className="text-link" href={`/forum/${board.slug}/sujet/${topic.slug}#${post.id}`}>Ouvrir →</Link>
                  </article>
                );
              })}
            </div>
          ) : <div className="tools-empty"><h3>Aucun message publié</h3><Link className="button button--primary" href="/forum">Parcourir le forum</Link></div>
        ) : visibleTopics.length > 0 ? (
          <div className="member-activity-list">
            {visibleTopics.map((topic) => {
              const board = boardMap.get(topic.board_id);
              if (!board) return null;
              const lastAuthor = profileMap.get(topic.last_author_id ?? topic.author_id) ?? "Membre";
              const state = statusLabel(topic);
              const unread = isUnread(topic);
              return (
                <article className={`member-activity-row${unread ? " member-activity-row--unread" : ""}`} key={topic.id}>
                  <div className="member-activity-row__state" aria-hidden="true">{unread ? "●" : "◇"}</div>
                  <div className="member-activity-row__main">
                    <div className="member-activity-row__meta">
                      <span>{board.title}</span>
                      {state ? <strong>{state}</strong> : null}
                    </div>
                    <Link className="member-activity-row__title" href={`/forum/${board.slug}/sujet/${topic.slug}${topic.last_post_id ? `#${topic.last_post_id}` : ""}`}>{topic.title}</Link>
                    <div className="member-activity-row__last"><span>{Math.max(0, (topic.post_count ?? 1) - 1)} réponse{Math.max(0, (topic.post_count ?? 1) - 1) > 1 ? "s" : ""}</span><span>{lastAuthor}</span><time dateTime={topic.last_activity_at}>{formatDate(topic.last_activity_at)}</time></div>
                  </div>
                  <Link className="text-link" href={`/forum/${board.slug}/sujet/${topic.slug}${topic.last_post_id ? `#${topic.last_post_id}` : ""}`}>{unread ? "Lire →" : "Ouvrir →"}</Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="tools-empty">
            <h3>{view === "non-lus" ? "Tout est à jour" : view === "suivis" ? "Aucun sujet suivi" : "Aucun sujet créé"}</h3>
            <Link className="button button--primary" href="/forum">Aller au forum</Link>
          </div>
        )}
      </section>
    </main>
  );
}
