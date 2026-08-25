import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { ForumReadMarker } from "@/components/forum-read-marker";
import { ForumThreadActions } from "@/components/forum-thread-actions";
import { createForumPost } from "@/app/forum/actions";
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

export default async function ForumTopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ board: string; topic: string }>;
  searchParams: Promise<{ erreur?: string }>;
}) {
  const [{ board: boardSlug, topic: topicSlug }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const userId = typeof claims?.sub === "string" ? claims.sub : null;

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
    .select("id, author_id, character_id, content, created_at, edited_at")
    .eq("topic_id", topic.id)
    .order("created_at", { ascending: true });

  if (postsError) notFound();

  const postRows = posts ?? [];
  const authorIds = Array.from(new Set(postRows.map((post) => post.author_id)));
  const characterIds = Array.from(
    new Set(
      [topic.character_id, ...postRows.map((post) => post.character_id)]
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
  const firstPostId = postRows.at(0)?.id ?? null;
  const lastPostId = postRows.at(-1)?.id ?? topic.last_post_id;
  const replyError = query.erreur === "reponse"
    ? "Votre réponse doit contenir au moins quelques caractères."
    : query.erreur === "publication"
      ? "La réponse n’a pas pu être publiée. Vérifiez vos droits ou réessayez dans un instant."
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
                {topic.topic_type ? <span>{topic.topic_type}</span> : null}
                {topic.rp_location ? <span>{topic.rp_location}</span> : null}
                {(Array.isArray(topic.tags) ? topic.tags : []).map((tag) => <span key={tag}>{tag}</span>)}
              </div>
              <h1>{topic.title}</h1>
              <p>{topic.excerpt}</p>
            </div>
            <div className="forum-thread-head__stats">
              <span><strong>{topic.post_count || postRows.length}</strong><small>Messages</small></span>
              <span><strong>{topic.view_count ?? 0}</strong><small>Vues</small></span>
            </div>
          </div>
        </div>
      </section>

      <section className="forum-thread content-frame">
        <div className="forum-thread__toolbar">
          <div className="forum-thread__toolbar-left">
            <Link className="text-link" href={`/forum/${boardRow.slug}`}>← Retour aux sujets</Link>
            <span>{postRows.length} message{postRows.length > 1 ? "s" : ""}</span>
          </div>
          <ForumThreadActions
            topicId={topic.id}
            locked={topic.is_locked}
            authenticated={Boolean(userId)}
            initialFollowing={initialFollowing}
            loginHref={loginHref}
          />
        </div>

        {postRows.length > 1 ? (
          <nav className="forum-thread-jump" aria-label="Navigation dans le sujet">
            <span>1–{postRows.length} sur {postRows.length} messages</span>
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
            const paragraphs: string[] = String(post.content)
              .split(/\n{2,}/)
              .map((paragraph: string) => paragraph.trim())
              .filter(Boolean);

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
                    </div>
                    <div className="forum-post__actions" aria-label="Actions du message">
                      <button type="button" disabled>Citer</button>
                      <button type="button" disabled>Signaler</button>
                    </div>
                  </header>

                  <div className="forum-post__content">
                    {(paragraphs.length ? paragraphs : [String(post.content)]).map((paragraph: string, paragraphIndex: number) => <p key={paragraphIndex}>{paragraph}</p>)}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {postRows.length > 1 ? (
          <nav className="forum-thread-jump forum-thread-jump--bottom" aria-label="Fin du sujet">
            <span>{postRows.length} messages</span>
            <div><a href="#forum-thread-top">↑ Retour en haut</a></div>
          </nav>
        ) : null}

        {!topic.is_locked ? (
          userId ? (
            <section className="forum-reply-box" id="repondre" aria-labelledby="reply-title">
              <div className="forum-reply-box__heading">
                <div><p className="eyebrow">Participation</p><h2 id="reply-title">Répondre au sujet</h2></div>
                <span className="status-pill">Publication réelle</span>
              </div>

              {replyError ? <div className="forum-editor-notice forum-editor-notice--error" role="alert">{replyError}</div> : null}

              <form action={createForumPost}>
                <input type="hidden" name="board_slug" value={boardRow.slug} />
                <input type="hidden" name="topic_slug" value={topic.slug} />
                <input type="hidden" name="topic_id" value={topic.id} />
                <div className="forum-reply-box__identity">
                  <span>Publier en tant que</span>
                  {section.mode === "rp" ? (
                    <select name="character_id" defaultValue="">
                      <option value="">Compte membre</option>
                      {ownedCharacters.map((character) => <option value={character.id} key={character.id}>{character.name}</option>)}
                    </select>
                  ) : <input type="hidden" name="character_id" value="" />}
                  <small>Le compte reste toujours l’auteur technique ; un personnage peut être attaché au message RP.</small>
                </div>
                <textarea name="content" aria-label="Contenu de la réponse" placeholder="Écrivez votre réponse…" rows={9} maxLength={50000} required />
                <div className="forum-reply-box__footer">
                  <span>Texte simple pour la première version connectée.</span>
                  <button className="button button--primary button--small" type="submit">Publier la réponse</button>
                </div>
              </form>
            </section>
          ) : (
            <div className="forum-access-note" id="repondre">
              <span aria-hidden="true">◇</span>
              <p><strong>Connectez-vous pour répondre.</strong> La lecture de ce sujet est disponible, mais la publication nécessite un compte membre. <Link href={loginHref}>Connexion / inscription →</Link></p>
            </div>
          )
        ) : (
          <div className="forum-thread-locked">Ce sujet est verrouillé. Aucune nouvelle réponse ne peut être publiée.</div>
        )}
      </section>
    </main>
  );
}
