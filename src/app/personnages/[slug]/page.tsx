import Link from "next/link";
import { notFound } from "next/navigation";
import { CharacterRelations } from "@/components/character-relations";
import { SiteHeader } from "@/components/site-header";
import { signedCharacterPortraitUrl } from "@/lib/character-portraits";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Hook = { title: string; text: string };

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase("fr") ?? "").join("") || "IM";
}

function getRole(appMetadata: unknown) {
  if (!appMetadata || typeof appMetadata !== "object" || !("role" in appMetadata)) return "member";
  return String((appMetadata as { role?: unknown }).role ?? "member");
}

function visibilityLabel(value: string) {
  if (value === "private") return "Privée";
  if (value === "unlisted") return "Non répertoriée";
  return "Publique";
}

function statusLabel(value: string) {
  if (value === "draft") return "Brouillon";
  if (value === "archived") return "Archivée";
  return "Publiée";
}

function formatActivity(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(value));
}

function messageLabel(value?: string) {
  if (value === "publie") return "La fiche est publiée et enregistrée.";
  if (value === "brouillon") return "Le brouillon est enregistré.";
  if (value === "archive") return "La fiche est archivée et retirée du répertoire.";
  return null;
}

export default async function CharacterProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;
  const role = getRole(claimsData?.claims?.app_metadata);
  const canModerate = role === "admin" || role === "moderator";

  const { data: character, error } = await supabase
    .from("characters")
    .select("id, owner_id, slug, name, epithet, short_summary, portrait_path, visibility, status, created_at, updated_at, world, people, age, origin, residence, occupation, affiliation, quote, traits, biography, hooks, is_featured, is_moderation_hidden, moderation_note, published_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !character) notFound();

  const isOwner = userId === character.owner_id;
  const portraitUrl = await signedCharacterPortraitUrl(supabase, character.portrait_path);
  const traits = Array.isArray(character.traits) ? character.traits : [];
  const rawHooks = Array.isArray(character.hooks) ? character.hooks : [];
  const hooks: Hook[] = rawHooks
    .filter((hook): hook is { title?: unknown; text?: unknown } => Boolean(hook) && typeof hook === "object")
    .map((hook) => ({ title: String(hook.title ?? ""), text: String(hook.text ?? "") }))
    .filter((hook) => hook.title || hook.text)
    .slice(0, 3);
  const biography = String(character.biography ?? "").split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);

  const { data: ownerProfile } = await supabase.from("profiles").select("display_name").eq("id", character.owner_id).maybeSingle();

  const { data: characterPosts } = await supabase
    .from("forum_posts")
    .select("id, topic_id, created_at")
    .eq("character_id", character.id)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(30);

  const latestPostByTopic = new Map<string, { id: string; created_at: string }>();
  for (const post of characterPosts ?? []) {
    if (!latestPostByTopic.has(post.topic_id)) {
      latestPostByTopic.set(post.topic_id, { id: post.id, created_at: post.created_at });
    }
  }

  const orderedTopicIds = Array.from(latestPostByTopic.keys()).slice(0, 8);
  const topicsResult = orderedTopicIds.length
    ? await supabase.from("forum_topics").select("id, board_id, title, slug, status, last_activity_at").in("id", orderedTopicIds)
    : { data: [] as { id: string; board_id: string; title: string; slug: string; status: string; last_activity_at: string }[] };
  const topicRows = topicsResult.data ?? [];
  const boardIds = Array.from(new Set(topicRows.map((topic) => topic.board_id)));
  const boardsResult = boardIds.length
    ? await supabase.from("forum_boards").select("id, slug, title").in("id", boardIds)
    : { data: [] as { id: string; slug: string; title: string }[] };
  const topicMap = new Map(topicRows.map((topic) => [topic.id, topic]));
  const boardMap = new Map((boardsResult.data ?? []).map((board) => [board.id, board]));
  const activities = orderedTopicIds.flatMap((topicId) => {
    const topic = topicMap.get(topicId);
    const latestPost = latestPostByTopic.get(topicId);
    if (!topic || !latestPost) return [];
    const board = boardMap.get(topic.board_id);
    if (!board) return [];
    return [{ ...topic, board, postId: latestPost.id, characterActivityAt: latestPost.created_at }];
  });
  const savedMessage = messageLabel(query.message);

  return (
    <main className="site-shell character-profile-page">
      <SiteHeader />

      <section className="character-profile-hero" aria-labelledby="character-name">
        <div className="character-profile-hero__image" aria-hidden="true" />
        <div className="character-profile-hero__veil" aria-hidden="true" />
        <div className="content-frame character-profile-hero__content">
          <div className="character-profile-hero__nav">
            <Link className="character-profile-hero__back" href="/personnages">← Tous les personnages</Link>
            <div className="character-live-header-actions">
              {isOwner ? <Link className="button button--ghost button--small" href={`/personnages/${character.slug}/modifier`}>Modifier cette fiche</Link> : null}
              {canModerate ? <Link className="button button--ghost button--small" href="/administration/personnages">Administration</Link> : null}
            </div>
          </div>
          {savedMessage ? <div className="character-live-message" role="status">{savedMessage}</div> : null}
          <div className="character-profile-hero__layout">
            <div className="character-profile-portrait" aria-hidden="true">
              {portraitUrl ? <img className="character-live-portrait" src={portraitUrl} alt="" /> : <span>{initials(character.name)}</span>}
              <small>{portraitUrl ? "Portrait membre" : "Portrait non renseigné"}</small>
            </div>
            <div className="character-profile-identity">
              <div className="character-profile-identity__meta">
                {(isOwner || canModerate || character.status !== "published") ? <span className="status-pill">{statusLabel(character.status)}</span> : null}
                {(isOwner || canModerate || character.visibility !== "public") ? <span>{visibilityLabel(character.visibility)}</span> : null}
                {character.is_featured ? <span>Mis en avant</span> : null}
                {character.is_moderation_hidden ? <span>Masqué par l’équipe</span> : null}
              </div>
              <p className="eyebrow">Personnage rôleplay</p>
              <h1 id="character-name">{character.name}</h1>
              <p className="character-profile-identity__epithet">{character.epithet || "Personnage d’Imetheran"}</p>
              {character.quote ? <blockquote>« {character.quote} »</blockquote> : null}
              <div className="character-profile-identity__tags">{traits.map((trait) => <span key={trait}>{trait}</span>)}</div>
            </div>
          </div>
        </div>
      </section>

      <nav className="character-profile-nav" aria-label={`Parcourir la fiche de ${character.name}`}>
        <div className="content-frame character-profile-nav__inner">
          <a href="#histoire">Histoire</a>
          <a href="#accroches">Accroches</a>
          <a href="#relations">Relations</a>
          <a href="#activite">Activité RP</a>
        </div>
      </nav>

      <section className="character-profile content-frame" aria-label={`Fiche de ${character.name}`}>
        <aside className="character-profile__sidebar">
          <section className="character-info-card">
            <p className="character-info-card__label">Repères</p>
            <dl>
              <div><dt>Peuple</dt><dd>{character.people || "—"}</dd></div>
              <div><dt>Âge</dt><dd>{character.age || "—"}</dd></div>
              <div><dt>Origine</dt><dd>{character.origin || "—"}</dd></div>
              <div><dt>Résidence</dt><dd>{character.residence || "—"}</dd></div>
              <div><dt>Occupation</dt><dd>{character.occupation || "—"}</dd></div>
              <div><dt>Affiliation</dt><dd>{character.affiliation || "—"}</dd></div>
              <div><dt>Monde</dt><dd>{character.world || "—"}</dd></div>
            </dl>
          </section>

          <section className="character-info-card character-info-card--summary">
            <p className="character-info-card__label">En quelques mots</p>
            <p>{character.short_summary || "Aucun résumé renseigné."}</p>
          </section>

          <section className="character-info-card">
            <p className="character-info-card__label">Joué par</p>
            <p className="character-info-card__small">{ownerProfile?.display_name ?? "Membre Imetheran"}</p>
            {(isOwner || canModerate || character.visibility !== "public") ? <p className="character-info-card__small">Visibilité : {visibilityLabel(character.visibility)}.</p> : null}
            {character.is_moderation_hidden && (isOwner || canModerate) ? <p className="character-live-warning">{character.moderation_note || "Cette fiche a été masquée par l’équipe."}</p> : null}
          </section>
        </aside>

        <article className="character-profile__main">
          <section className="character-profile-section character-profile-section--biography" id="histoire">
            <p className="panel__kicker">Histoire</p>
            <h2>Parcours</h2>
            {biography.length > 0 ? (
              <div className="character-profile-section__prose">{biography.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
            ) : <p className="character-profile-section__empty">Aucune biographie renseignée pour le moment.</p>}
          </section>

          <section className="character-profile-section" id="accroches">
            <div className="character-profile-section__heading"><div><p className="panel__kicker">Rencontres possibles</p><h2>Accroches RP</h2></div>{hooks.length > 0 ? <span className="status-pill status-pill--quiet">Ouvert au jeu</span> : null}</div>
            {hooks.length > 0 ? (
              <div className="character-hooks">{hooks.map((hook, index) => <article className="character-hook" key={`${hook.title}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><h3>{hook.title || "Accroche"}</h3><p>{hook.text}</p></article>)}</div>
            ) : <p className="character-profile-section__empty">Aucune accroche RP renseignée.</p>}
          </section>

          <section className="character-profile-section" id="relations">
            <div className="character-profile-section__heading"><div><p className="panel__kicker">Sociogramme</p><h2>Relations</h2></div><Link className="text-link" href="/liens">Voir les liens <span aria-hidden="true">→</span></Link></div>
            <CharacterRelations characterId={character.id} />
          </section>

          <section className="character-profile-section" id="activite">
            <div className="character-profile-section__heading">
              <div><p className="panel__kicker">Traces communautaires</p><h2>Activité RP</h2></div>
              {activities.length > 0 ? <span className="status-pill status-pill--quiet">{activities.length} scène{activities.length > 1 ? "s" : ""}</span> : null}
            </div>
            {activities.length > 0 ? (
              <div className="character-activity">
                {activities.map((activity, index) => (
                  <Link className="character-live-activity-link" href={`/forum/${activity.board.slug}/sujet/${activity.slug}#${activity.postId}`} key={activity.id}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <small>Forum · {activity.board.title}</small>
                      <h3>{activity.title}</h3>
                      <p>{activity.status === "open" ? "Sujet en cours" : activity.status === "finished" ? "Sujet terminé" : "Sujet archivé"}</p>
                      <time dateTime={activity.characterActivityAt}>Dernière intervention du personnage · {formatActivity(activity.characterActivityAt)}</time>
                    </div>
                  </Link>
                ))}
              </div>
            ) : <p className="character-profile-section__empty">Aucune activité RP visible liée à ce personnage pour le moment.</p>}
          </section>
        </article>
      </section>
    </main>
  );
}
