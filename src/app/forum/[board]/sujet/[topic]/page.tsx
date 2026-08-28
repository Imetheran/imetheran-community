import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { BbcodeContent } from "@/components/bbcode-content";
import { ForumReadMarker } from "@/components/forum-read-marker";
import { ForumThreadActions } from "@/components/forum-thread-actions";
import { ForumReportControl } from "@/components/forum-report-control";
import { ForumPostOwnerActions } from "@/components/forum-post-owner-actions";
import { ForumQuoteButton } from "@/components/forum-quote-button";
import { ForumReplyEditor } from "@/components/forum-reply-editor";
import { canUseForumWritePolicy } from "@/lib/forum-access";
import {
  extractForumMediaIds,
  FORUM_MEDIA_BUCKET,
  type ForumMediaRenderMap,
} from "@/lib/forum-media";
import { forumTopicTypeLabel } from "@/lib/forum-presentation";
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
  const result = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("fr") ?? "")
    .join("");
  return result || "IM";
}

function readRole(claims: Record<string, unknown> | undefined) {
  const appMetadata = claims?.app_metadata;
  if (!appMetadata || typeof appMetadata !== "object" || !("role" in appMetadata)) return "member";
  return String((appMetadata as { role?: unknown }).role ?? "member");
}

export default async function ForumTopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ board: string; topic: string }>;
  searchParams: Promise<{ erreur?: string; message?: string }>;
}) {
  const [{ board: boardSlug, topic: topicSlug }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims as Record<string, unknown> | undefined;
  const userId = typeof claims?.sub === "string" ? claims.sub : null;
  const role = readRole(claims);
  const canModerate = role === "admin" || role === "moderator";
  const participation = await getMemberParticipation(supabase, userId);

  const { data: boardRow, error: boardError } = await supabase
    .from("forum_boards")
    .select(`
      id,
      slug,
      title,
      description,
      reply_policy,
      is_active,
      forum_sections!inner (
        id,
        title,
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

  const { data: topic, error: topicError } = await supabase
    .from("forum_topics")
    .select(`
      id,
      slug,
      title,
      excerpt,
      author_id,
      character_id,
      created_at,
      last_activity_at,
      last_post_id,
      post_count,
      view_count,
      is_pinned,
      is_locked,
      status,
      tags,
      topic_type,
      rp_location
    `)
    .eq("board_id", boardRow.id)
    .eq("slug", topicSlug)
    .maybeSingle();

  if (topicError || !topic) notFound();

  const { data: posts, error: postsError } = await supabase
    .from("forum_posts")
    .select("id, author_id, character_id, content, created_at, edited_at, is_hidden")
    .eq("topic_id", topic.id)
    .order("created_at", { ascending: true });

  if (postsError) notFound();

  const postRows = posts ?? [];
  const postCount = postRows.length;
  const authorIds = Array.from(new Set(postRows.map((post) => post.author_id)));
  const characterIds = Array.from(
    new Set(
      [topic.character_id, ...postRows.map((post) => post.character_id)]
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  );
  const mediaIds = Array.from(new Set(postRows.flatMap((post) => extractForumMediaIds(String(post.content)))));

  const profileMap = new Map<string, string>();
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", authorIds);
    for (const profile of profiles ?? []) profileMap.set(profile.id, profile.display_name);
  }

  const characterMap = new Map<string, { name: string; slug: string }>();
  if (characterIds.length > 0) {
    const { data: characters } = await supabase
      .from("characters")
      .select("id, name, slug")
      .in("id", characterIds);
    for (const character of characters ?? []) {
      characterMap.set(character.id, { name: character.name, slug: character.slug });
    }
  }

  const mediaMap: ForumMediaRenderMap = {};
  if (mediaIds.length > 0) {
    const { data: mediaRows } = await supabase
      .from("forum_media")
      .select("id, storage_path, width, height")
      .in("id", mediaIds);

    const visibleMedia = mediaRows ?? [];
    if (visibleMedia.length > 0) {
      const { data: signedRows } = await supabase.storage
        .from(FORUM_MEDIA_BUCKET)
        .createSignedUrls(visibleMedia.map((media) => media.storage_path), 3600);
      const signedByPath = new Map(
        (signedRows ?? [])
          .filter((item) => Boolean(item.signedUrl))
          .map((item) => [item.path, item.signedUrl as string]),
      );

      for (const media of visibleMedia) {
        const signedUrl = signedByPath.get(media.storage_path);
        if (!signedUrl) continue;
        mediaMap[String(media.id).toLowerCase()] = {
          url: signedUrl,
          width: Number(media.width),
          height: Number(media.height),
        };
      }
    }
  }

  let initialFollowing = false;
  let ownedCharacters: { id: string; name: string }[] = [];
  if (userId) {
    const [{ data: follow }, ownedCharacterResult] = await Promise.all([
      supabase
        .from("forum_topic_follows")
        .select("topic_id")
        .eq("topic_id", topic.id)
        .eq("user_id", userId)
        .maybeSingle(),
      section.mode === "rp"
        ? supabase.from("characters").select("id, name").eq("owner_id", userId).order("name")
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    ]);
    initialFollowing = Boolean(follow);
    ownedCharacters = ownedCharacterResult.data ?? [];
  }

  const loginHref = `/connexion?message=connexion-requise&retour=${encodeURIComponent(`/forum/${boardRow.slug}/sujet/${topic.slug}#repondre`)}`;
  const reportLoginHref = `/connexion?message=connexion-requise&retour=${encodeURIComponent(`/forum/${boardRow.slug}/sujet/${topic.slug}`)}`;
  const firstPostId = postRows.at(0)?.id ?? null;
  const lastPostId = postRows.at(-1)?.id ?? topic.last_post_id;
  const repliesOpen = topic.status === "open" && !topic.is_locked;
  const replyAllowed = canUseForumWritePolicy(boardRow.reply_policy, userId, role, participation.canParticipate);
  const canReply = repliesOpen && replyAllowed;
  const replyRequiresLogin = !userId && boardRow.reply_policy === "members";
  const replyError = query.erreur === "reponse"
    ? "Votre réponse doit contenir au moins quelques caractères."
    : query.erreur === "suspendu"
      ? "Votre participation est suspendue. La lecture reste disponible, mais vous ne pouvez pas publier."
      : query.erreur === "fermee"
        ? "Les réponses sont actuellement fermées dans ce forum ou ce sujet."
        : query.erreur === "reservee"
          ? "Les réponses sont réservées à l’équipe dans ce forum."
          : query.erreur === "media-limite"
            ? "Un message peut contenir au maximum 8 images."
            : query.erreur === "media"
              ? "Une image de ce message n’est pas rattachée à votre compte. Retirez-la puis renvoyez votre propre fichier."
              : query.erreur === "publication"
                ? "La réponse n’a pas pu être publiée. Vérifiez vos droits ou réessayez dans un instant."
                : null;
  const reportFeedback = query.message === "signalement"
    ? { kind: "success", text: "Signalement transmis à l’équipe de modération." }
    : query.erreur === "signalement-deja"
      ? { kind: "error", text: "Vous avez déjà un signalement en cours pour ce message." }
      : query.erreur === "signalement"
        ? { kind: "error", text: "Le signalement n’a pas pu être enregistré. Réessayez dans un instant." }
        : null;
  const memberFeedback = query.message === "message-modifie"
    ? { kind: "success", text: "Votre message a bien été modifié." }
    : query.message === "message-supprime"
      ? { kind: "success", text: "Votre message a bien été supprimé." }
      : query.erreur === "media-attache"
        ? { kind: "error", text: "Le message a été enregistré, mais au moins une image n’a pas pu être rattachée. Modifiez le message et renvoyez l’image concernée." }
        : query.erreur === "edition-media"
          ? { kind: "error", text: "Vous ne pouvez insérer que vos propres images dans ce message." }
          : query.erreur === "edition-champs"
            ? { kind: "error", text: "Le message doit contenir au moins deux caractères et ne pas dépasser 50 000 caractères." }
            : query.erreur === "edition-suspendue"
              ? { kind: "error", text: "Votre participation est suspendue : vous pouvez supprimer un message autorisé, mais pas le modifier." }
              : query.erreur === "edition-droits"
                ? { kind: "error", text: "Vous ne pouvez modifier que vos propres messages." }
                : query.erreur === "edition-fermee"
                  ? { kind: "error", text: "Ce message ne peut plus être modifié car le sujet est verrouillé, terminé, archivé ou masqué par la modération." }
                  : query.erreur === "edition"
                    ? { kind: "error", text: "La modification n’a pas pu être enregistrée." }
                    : query.erreur === "suppression-signalement"
                      ? { kind: "error", text: "Ce contenu fait l’objet d’un signalement en cours et doit rester disponible pour la modération." }
                      : query.erreur === "suppression-fermee"
                        ? { kind: "error", text: "La suppression n’est plus disponible sur un sujet verrouillé, terminé ou archivé." }
                        : query.erreur === "sujet-reponses"
                          ? { kind: "error", text: "Ce sujet a reçu une réponse : il ne peut plus être supprimé par son auteur." }
                          : query.erreur === "suppression-droits"
                            ? { kind: "error", text: "Vous ne pouvez supprimer que vos propres messages." }
                            : query.erreur === "suppression-sujet"
                              ? { kind: "error", text: "Le premier message doit être supprimé avec le sujet entier, uniquement avant toute réponse." }
                              : query.erreur === "suppression-message"
                                ? { kind: "error", text: "Le message n’a pas pu être supprimé." }
                                : null;

  return (
    <main className="site-shell forum-thread-page" id="forum-thread-top">
      <SiteHeader />
      {userId ? <ForumReadMarker topicId={topic.id} lastPostId={lastPostId} /> : null}

      <section className="forum-thread-head">
        <div className="content-frame">
          <nav className="forum-breadcrumbs" aria-label="Fil d’Ariane">
            <Link href="/forum">Forum</Link><span>›</span>
            <span>{section.title}</span><span>›</span>
            <Link href={`/forum/${boardRow.slug}`}>{boardRow.title}</Link>
          </nav>

          <div className="forum-thread-head__layout">
            <div>
              <div className="forum-thread-head__badges">
                {topic.is_pinned ? <span className="forum-board__badge">Épinglé</span> : null}
                {topic.is_locked ? <span className="forum-board__badge">Verrouillé</span> : null}
                {topic.status === "finished" ? <span className="forum-board__badge">Terminé</span> : null}
                {topic.status === "archived" ? <span className="forum-board__badge">Archivé</span> : null}
                {topic.topic_type ? <span>{forumTopicTypeLabel(topic.topic_type)}</span> : null}
                {topic.rp_location ? <span>{topic.rp_location}</span> : null}
                {(Array.isArray(topic.tags) ? topic.tags : []).map((tag) => <span key={tag}>{tag}</span>)}
              </div>
              <h1>{topic.title}</h1>
              <p>{topic.excerpt}</p>
            </div>
            <div className="forum-thread-head__stats">
              <span><strong>{postCount}</strong><small>Messages</small></span>
              <span><strong>{topic.view_count ?? 0}</strong><small>Vues</small></span>
            </div>
          </div>
        </div>
      </section>

      <section className="forum-thread content-frame">
        <div className="forum-thread__toolbar">
          <div className="forum-thread__toolbar-left">
            <Link className="text-link" href={`/forum/${boardRow.slug}`}>← Retour aux sujets</Link>
            <span>{postCount} message{postCount > 1 ? "s" : ""}</span>
          </div>
          <ForumThreadActions
            topicId={topic.id}
            boardSlug={boardRow.slug}
            topicSlug={topic.slug}
            locked={topic.is_locked}
            pinned={topic.is_pinned}
            status={topic.status}
            authenticated={Boolean(userId)}
            initialFollowing={initialFollowing}
            canModerate={canModerate}
            canParticipateInReplies={replyAllowed}
            replyRequiresLogin={replyRequiresLogin}
            loginHref={loginHref}
          />
        </div>

        {reportFeedback ? (
          <div className={`forum-editor-notice${reportFeedback.kind === "error" ? " forum-editor-notice--error" : ""}`} role={reportFeedback.kind === "error" ? "alert" : "status"}>
            {reportFeedback.text}
          </div>
        ) : null}

        {memberFeedback ? (
          <div className={`forum-editor-notice${memberFeedback.kind === "error" ? " forum-editor-notice--error" : ""}`} role={memberFeedback.kind === "error" ? "alert" : "status"}>
            {memberFeedback.text}
          </div>
        ) : null}

        {replyError ? <div className="forum-editor-notice forum-editor-notice--error" role="alert">{replyError}</div> : null}

        {postCount > 1 ? (
          <nav className="forum-thread-jump" aria-label="Navigation dans le sujet">
            <span>{postCount} messages</span>
            <div>
              {firstPostId ? <a href={`#${firstPostId}`}>Premier message</a> : null}
              {lastPostId ? <a href={`#${lastPostId}`}>Dernier message ↓</a> : null}
            </div>
          </nav>
        ) : null}

        <div className="forum-posts">
          {postRows.map((post, index) => {
            const authorName = profileMap.get(post.author_id) ?? "Membre";
            const character = post.character_id ? characterMap.get(post.character_id) : null;
            const isOwnPost = Boolean(userId && post.author_id === userId);
            const canEditOwnPost = isOwnPost && repliesOpen && participation.canParticipate;
            const deleteKind = isOwnPost && repliesOpen
              ? index === 0
                ? postRows.length === 1 ? "topic" as const : null
                : "post" as const
              : null;

            return (
              <article className={`forum-post${index === 0 ? " forum-post--topic-author" : ""}`} id={post.id} key={post.id}>
                <aside className="forum-post__author">
                  <div className="forum-post__avatar" aria-hidden="true">{initials(authorName)}</div>
                  <strong>{authorName}</strong>
                  <span className="forum-post__role">Membre</span>
                  {index === 0 ? <span className="forum-post__starter">Auteur du sujet</span> : null}
                  {character ? (
                    <Link className="forum-post__character" href={`/personnages/${character.slug}`}>
                      <small>Écrit avec</small>
                      <span>{character.name}</span>
                    </Link>
                  ) : null}
                </aside>

                <div className="forum-post__body">
                  <header>
                    <div>
                      <a className="forum-post__number" href={`#${post.id}`} aria-label={`Lien vers le message ${index + 1}`}>#{index + 1}</a>
                      <time dateTime={post.created_at}>{formatActivity(post.created_at)}</time>
                      {post.edited_at ? <small>Modifié {formatActivity(post.edited_at)}</small> : null}
                      {post.is_hidden ? <small>Masqué aux membres · visible par l’équipe</small> : null}
                    </div>
                    <div className="forum-post__actions" aria-label="Actions du message">
                      {canReply ? <ForumQuoteButton authorName={authorName} content={String(post.content)} /> : null}
                      {isOwnPost && (canEditOwnPost || deleteKind) ? (
                        <ForumPostOwnerActions
                          postId={post.id}
                          topicId={topic.id}
                          boardSlug={boardRow.slug}
                          topicSlug={topic.slug}
                          content={String(post.content)}
                          canEdit={canEditOwnPost}
                          deleteKind={deleteKind}
                          isFirstPost={index === 0}
                          initialMediaMap={mediaMap}
                        />
                      ) : null}
                      <ForumReportControl
                        topicId={topic.id}
                        postId={post.id}
                        boardSlug={boardRow.slug}
                        topicSlug={topic.slug}
                        authenticated={Boolean(userId)}
                        loginHref={reportLoginHref}
                      />
                    </div>
                  </header>

                  <div className="forum-post__content">
                    <BbcodeContent content={String(post.content)} mediaMap={mediaMap} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {postCount > 1 ? (
          <nav className="forum-thread-jump forum-thread-jump--bottom" aria-label="Fin du sujet">
            <span>{postCount} messages</span>
            <div><a href="#forum-thread-top">↑ Retour en haut</a></div>
          </nav>
        ) : null}

        {!repliesOpen ? (
          <div className="forum-thread-locked" id="repondre">
            {topic.status === "archived"
              ? "Ce sujet est archivé. Aucune nouvelle réponse ne peut être publiée."
              : topic.status === "finished"
                ? "Ce sujet est terminé. Il peut être rouvert par l’équipe si nécessaire."
                : "Ce sujet est verrouillé. Aucune nouvelle réponse ne peut être publiée."}
          </div>
        ) : canReply ? (
          <section className="forum-reply-box" id="repondre" aria-labelledby="reply-title">
            <div className="forum-reply-box__heading">
              <div><p className="eyebrow">Participation</p><h2 id="reply-title">Répondre au sujet</h2></div>
              <span className="status-pill">BBCode</span>
            </div>

            <ForumReplyEditor
              boardSlug={boardRow.slug}
              topicSlug={topic.slug}
              topicId={topic.id}
              isRoleplay={section.mode === "rp"}
              characters={ownedCharacters}
            />
          </section>
        ) : userId && !participation.canParticipate ? (
          <div className="forum-access-note" id="repondre">
            <span aria-hidden="true">!</span>
            <p><strong>Votre participation est suspendue.</strong> Vous pouvez continuer à lire et signaler un contenu, mais pas répondre. <Link href="/compte">Consulter mon compte →</Link></p>
          </div>
        ) : boardRow.reply_policy === "closed" ? (
          <div className="forum-thread-locked" id="repondre">Les réponses sont fermées dans ce forum.</div>
        ) : boardRow.reply_policy === "staff" ? (
          <div className="forum-thread-locked" id="repondre">Les réponses sont réservées à l’équipe de modération.</div>
        ) : (
          <div className="forum-access-note" id="repondre">
            <span aria-hidden="true">◇</span>
            <p><strong>Connectez-vous pour répondre.</strong> La lecture de ce sujet est disponible, mais la publication nécessite un compte membre. <Link href={loginHref}>Connexion / inscription →</Link></p>
          </div>
        )}
      </section>
    </main>
  );
}
