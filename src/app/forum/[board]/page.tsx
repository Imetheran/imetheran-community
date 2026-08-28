import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { ForumBoardTopics, type ForumTopicListItem } from "@/components/forum-board-topics";
import { canUseForumWritePolicy, forumWriteRestrictionLabel } from "@/lib/forum-access";
import { getMemberParticipation } from "@/lib/member-participation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function formatActivity(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(value));
}

function initials(name: string) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("fr") ?? "")
    .join("");
  return letters || "IM";
}

function readRole(claims: Record<string, unknown> | undefined) {
  const appMetadata = claims?.app_metadata;
  if (!appMetadata || typeof appMetadata !== "object" || !("role" in appMetadata)) return "member";
  return String((appMetadata as { role?: unknown }).role ?? "member");
}

export default async function ForumBoardPage({ params }: { params: Promise<{ board: string }> }) {
  const { board: boardSlug } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims as Record<string, unknown> | undefined;
  const userId = typeof claims?.sub === "string" ? claims.sub : null;
  const role = readRole(claims);
  const participation = await getMemberParticipation(supabase, userId);

  const { data: boardRow, error: boardError } = await supabase
    .from("forum_boards")
    .select(`
      id,
      slug,
      title,
      description,
      badge,
      topic_creation,
      reply_policy,
      is_active,
      forum_sections!inner (
        id,
        slug,
        title,
        subtitle,
        mode,
        access_scope,
        is_active
      )
    `)
    .eq("slug", boardSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (boardError || !boardRow) notFound();

  const section = Array.isArray(boardRow.forum_sections)
    ? boardRow.forum_sections[0]
    : boardRow.forum_sections;

  if (!section || !section.is_active) notFound();

  const { data: topicRows, error: topicError } = await supabase
    .from("forum_topics")
    .select(`
      id,
      slug,
      title,
      excerpt,
      author_id,
      created_at,
      last_activity_at,
      last_author_id,
      last_post_id,
      post_count,
      view_count,
      is_pinned,
      is_locked,
      status,
      tags
    `)
    .eq("board_id", boardRow.id)
    .order("is_pinned", { ascending: false })
    .order("last_activity_at", { ascending: false });

  const topics = topicRows ?? [];
  const authorIds = Array.from(
    new Set(
      topics
        .flatMap((topic) => [topic.author_id, topic.last_author_id])
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  );

  const profileMap = new Map<string, string>();
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", authorIds);

    for (const profile of profiles ?? []) profileMap.set(profile.id, profile.display_name);
  }

  const readMap = new Map<string, string>();
  if (userId && topics.length > 0) {
    const { data: reads } = await supabase
      .from("forum_topic_reads")
      .select("topic_id, last_read_at")
      .eq("user_id", userId)
      .in("topic_id", topics.map((topic) => topic.id));

    for (const read of reads ?? []) readMap.set(read.topic_id, read.last_read_at);
  }

  const topicItems: ForumTopicListItem[] = topics.map((topic) => {
    const authorName = profileMap.get(topic.author_id) ?? "Membre";
    const lastAuthorName =
      (topic.last_author_id ? profileMap.get(topic.last_author_id) : null) ?? authorName;
    const lastReadAt = readMap.get(topic.id);
    const unread = Boolean(
      userId &&
        (lastReadAt
          ? new Date(topic.last_activity_at).getTime() > new Date(lastReadAt).getTime()
          : topic.author_id !== userId),
    );

    return {
      id: topic.id,
      slug: topic.slug,
      title: topic.title,
      excerpt: topic.excerpt,
      author: { name: authorName, initials: initials(authorName) },
      createdAt: formatActivity(topic.created_at),
      lastActivity: formatActivity(topic.last_activity_at),
      lastActivityIso: topic.last_activity_at,
      replies: Math.max(0, (topic.post_count ?? 0) - 1),
      views: topic.view_count ?? 0,
      pinned: topic.is_pinned,
      locked: topic.is_locked,
      status: topic.status,
      tags: Array.isArray(topic.tags) ? topic.tags : [],
      lastAuthor: { name: lastAuthorName },
      lastPostId: topic.last_post_id,
      unread,
    };
  });

  const restricted = section.access_scope === "members" && !userId;
  const mayCreate = canUseForumWritePolicy(boardRow.topic_creation, userId, role, participation.canParticipate);
  const creationRestriction = userId
    ? forumWriteRestrictionLabel(boardRow.topic_creation, role, participation.canParticipate)
    : boardRow.topic_creation === "staff"
      ? "Publication réservée à l’équipe"
      : boardRow.topic_creation === "closed"
        ? "Publication fermée"
        : null;
  const loginHref = `/connexion?message=connexion-requise&retour=${encodeURIComponent(`/forum/${boardRow.slug}/nouveau`)}`;

  return (
    <main className="site-shell forum-board-page">
      <SiteHeader />

      <section className="forum-subhero">
        <div className="forum-subhero__image" aria-hidden="true" />
        <div className="forum-subhero__veil" aria-hidden="true" />
        <div className="content-frame forum-subhero__content">
          <nav className="forum-breadcrumbs" aria-label="Fil d’Ariane">
            <Link href="/forum">Forum</Link><span>›</span><span>{section.title}</span><span>›</span><strong>{boardRow.title}</strong>
          </nav>
          <div className="forum-subhero__heading">
            <div>
              <p className="eyebrow">{section.mode === "rp" ? "Espace rôleplay" : "Espace hors-RP"}</p>
              <h1>{boardRow.title}</h1>
              <p>{boardRow.description}</p>
            </div>
            <div className="forum-subhero__meta">
              <span className={`forum-section__mode forum-section__mode--${section.mode}`}>{section.mode === "rp" ? "RP" : "Hors-RP"}</span>
              {section.access_scope === "members" ? <span className="forum-section__access forum-section__access--members">Membres uniquement</span> : null}
              {section.access_scope === "guest-read" ? <span className="forum-section__access forum-section__access--guest-read">Lecture invités</span> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="forum-board-view content-frame">
        <div className="forum-board-toolbar">
          <div>
            <Link className="text-link" href="/forum">← Retour à l’index</Link>
            <span className="forum-board-toolbar__demo">{topicItems.length} sujet{topicItems.length > 1 ? "s" : ""}</span>
          </div>
          {mayCreate ? (
            <Link className="button button--primary button--small" href={`/forum/${boardRow.slug}/nouveau`}>Nouveau sujet</Link>
          ) : !userId && boardRow.topic_creation === "members" ? (
            <Link className="button button--primary button--small" href={loginHref}>Se connecter pour participer</Link>
          ) : (
            <span className="status-pill status-pill--quiet">{creationRestriction ?? "Publication indisponible"}</span>
          )}
        </div>

        {userId && !participation.canParticipate ? (
          <div className="forum-access-note">
            <span aria-hidden="true">!</span>
            <p><strong>Votre participation est actuellement suspendue.</strong> Vous pouvez continuer à lire le forum, mais pas créer ni modifier de contenu. <Link href="/compte">Consulter mon compte →</Link></p>
          </div>
        ) : null}

        {restricted ? (
          <div className="forum-access-note">
            <span aria-hidden="true">◇</span>
            <p><strong>Cette section est réservée aux membres.</strong> Connectez-vous pour consulter ses sujets et participer aux échanges.</p>
          </div>
        ) : null}

        {topicError ? (
          <div className="forum-access-note">
            <span aria-hidden="true">!</span>
            <p><strong>Les sujets ne peuvent pas être affichés pour le moment.</strong> Réessayez dans quelques instants.</p>
          </div>
        ) : null}

        {!restricted ? (
          <ForumBoardTopics boardSlug={boardRow.slug} topics={topicItems} />
        ) : (
          <div className="forum-empty-board">
            <span aria-hidden="true">◇</span>
            <div>
              <p className="eyebrow">Accès membre</p>
              <h2>Connectez-vous pour découvrir les sujets</h2>
              <p>Les discussions de cet espace sont réservées aux membres de la communauté.</p>
              <Link className="button button--ghost button--small" href={loginHref}>Connexion / inscription</Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
