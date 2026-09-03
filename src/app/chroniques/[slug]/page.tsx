import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import {
  chronicleChapterLabels,
  chronicleNarrativeLabels,
  formatChronicleDate,
  getAppRole,
  splitChronicleBody,
  type ChronicleChapterStatus,
  type ChronicleNarrativeStatus,
} from "@/lib/chronicles";

export const dynamic = "force-dynamic";

export default async function ChronicleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const role = getAppRole(claimsData?.claims?.app_metadata);
  const isAdmin = role === "admin";

  let chronicleQuery = supabase
    .from("chronicles")
    .select("id, slug, title, subtitle, synopsis, hook, narrative_status, publication_status, featured, cover_image, started_at, location, organizer, tags, published_at")
    .eq("slug", slug);
  if (!isAdmin) chronicleQuery = chronicleQuery.eq("publication_status", "published");

  const { data: chronicle, error } = await chronicleQuery.maybeSingle();
  if (error || !chronicle) notFound();

  const [chaptersResult, participantsResult] = await Promise.all([
    supabase
      .from("chronicle_chapters")
      .select("id, sort_order, act, title, summary, body, status, forum_topic_id")
      .eq("chronicle_id", chronicle.id)
      .order("sort_order")
      .order("created_at"),
    supabase
      .from("chronicle_participants")
      .select("id, character_id, label, sort_order")
      .eq("chronicle_id", chronicle.id)
      .order("sort_order")
      .order("created_at"),
  ]);
  const chapters = chaptersResult.data ?? [];
  const participants = participantsResult.data ?? [];

  const characterIds = participants.flatMap((participant) => participant.character_id ? [participant.character_id] : []);
  const { data: characters } = characterIds.length
    ? await supabase.from("characters").select("id, slug, name").in("id", characterIds)
    : { data: [] as { id: string; slug: string; name: string }[] };
  const characterMap = new Map((characters ?? []).map((character) => [character.id, character]));

  const topicIds = chapters.flatMap((chapter) => chapter.forum_topic_id ? [chapter.forum_topic_id] : []);
  const { data: topics } = topicIds.length
    ? await supabase.from("forum_topics").select("id, board_id, slug, title").in("id", topicIds)
    : { data: [] as { id: string; board_id: string; slug: string; title: string }[] };
  const boardIds = Array.from(new Set((topics ?? []).map((topic) => topic.board_id)));
  const { data: boards } = boardIds.length
    ? await supabase.from("forum_boards").select("id, slug, title").in("id", boardIds)
    : { data: [] as { id: string; slug: string; title: string }[] };
  const topicMap = new Map((topics ?? []).map((topic) => [topic.id, topic]));
  const boardMap = new Map((boards ?? []).map((board) => [board.id, board]));

  const narrativeStatus = chronicle.narrative_status as ChronicleNarrativeStatus;

  return (
    <main className="site-shell chronicles-page">
      <SiteHeader />

      <section className="chronicle-hero" aria-labelledby="chronicle-title">
        <div
          className="chronicle-hero__image"
          style={{ backgroundImage: chronicle.cover_image ? `url(${chronicle.cover_image})` : "var(--hero-image)" }}
          aria-hidden="true"
        />
        <div className="chronicle-hero__veil" aria-hidden="true" />
        <div className="content-frame chronicle-hero__content">
          <div className="chronicle-hero__status">
            <span className="status-pill">{chronicleNarrativeLabels[narrativeStatus]}</span>
            <span>{chronicle.publication_status === "published" ? "Chronique publiée" : `Prévisualisation admin · ${chronicle.publication_status}`}</span>
          </div>
          <p className="eyebrow">Les fils rouges d’Imetheran</p>
          <h1 id="chronicle-title">{chronicle.title}</h1>
          <p className="chronicle-hero__subtitle">{chronicle.subtitle}</p>
          <p className="chronicle-hero__synopsis">{chronicle.synopsis}</p>
          <div className="chronicle-hero__tags">{((chronicle.tags ?? []) as string[]).map((tag: string) => <span key={tag}>{tag}</span>)}</div>
          <div className="chronicle-detail-actions">
            <Link className="button button--ghost button--small" href="/chroniques">Toutes les chroniques</Link>
            {isAdmin ? <Link className="button button--ghost button--small" href={`/administration/chroniques/${chronicle.id}`}>Modifier</Link> : null}
          </div>
        </div>
      </section>

      <section className="chronicle-dossier content-frame" aria-labelledby="chronicle-dossier-title">
        <header className="section-heading section-heading--row">
          <div><p className="eyebrow">Dossier de chronique</p><h2 id="chronicle-dossier-title">Le scénario et sa progression</h2></div>
          <span className="status-pill status-pill--quiet">{chapters.length} acte{chapters.length > 1 ? "s" : ""}</span>
        </header>

        <div className="chronicle-layout">
          <aside className="chronicle-sidebar">
            <section className="chronicle-info-card">
              <p className="chronicle-info-card__label">Repères</p>
              <dl>
                <div><dt>Statut</dt><dd>{chronicleNarrativeLabels[narrativeStatus]}</dd></div>
                <div><dt>Début</dt><dd>{formatChronicleDate(chronicle.started_at)}</dd></div>
                <div><dt>Lieu</dt><dd>{chronicle.location || "—"}</dd></div>
                <div><dt>Organisation</dt><dd>{chronicle.organizer || "Équipe d’Imetheran"}</dd></div>
              </dl>
            </section>

            <section className="chronicle-info-card">
              <p className="chronicle-info-card__label">Personnages impliqués</p>
              {participants.length ? (
                <ul className="chronicle-participants">
                  {participants.map((participant, index) => {
                    const character = participant.character_id ? characterMap.get(participant.character_id) : null;
                    return (
                      <li key={participant.id}>
                        <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                        {character ? <Link className="chronicle-participant-link" href={`/personnages/${character.slug}`}>{participant.label || character.name}</Link> : participant.label}
                      </li>
                    );
                  })}
                </ul>
              ) : <p className="chronicle-info-card__note">Aucun participant affiché pour le moment.</p>}
            </section>

            {chronicle.hook ? <section className="chronicle-info-card chronicle-info-card--hook"><p className="chronicle-info-card__label">Intention</p><p>{chronicle.hook}</p></section> : null}
          </aside>

          <article className="chronicle-story">
            <div className="chronicle-story__intro">
              <p className="panel__kicker">Synopsis</p>
              <h2>{chronicle.title}</h2>
              <p>{chronicle.synopsis}</p>
            </div>

            {chapters.length ? (
              <div className="chronicle-timeline" aria-label="Progression de la chronique">
                {chapters.map((chapter) => {
                  const chapterStatus = chapter.status as ChronicleChapterStatus;
                  const topic = chapter.forum_topic_id ? topicMap.get(chapter.forum_topic_id) : null;
                  const board = topic ? boardMap.get(topic.board_id) : null;
                  return (
                    <section className={`chronicle-chapter chronicle-chapter--${chapterStatus}`} key={chapter.id}>
                      <div className="chronicle-chapter__rail" aria-hidden="true"><span /></div>
                      <div className="chronicle-chapter__content">
                        <div className="chronicle-chapter__heading">
                          <div><p>{chapter.act || "Acte"}</p><h3>{chapter.title}</h3></div>
                          <span className="chronicle-chapter__status">{chronicleChapterLabels[chapterStatus]}</span>
                        </div>
                        {chapter.summary ? <p className="chronicle-chapter__summary">{chapter.summary}</p> : null}
                        <div className="chronicle-chapter__body">{splitChronicleBody(chapter.body).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
                        {topic && board ? (
                          <Link className="chronicle-chapter__forum chronicle-chapter__forum--link" href={`/forum/${board.slug}/sujet/${topic.slug}`}>
                            <span>Forum lié</span><strong>{topic.title} →</strong>
                          </Link>
                        ) : chapter.forum_topic_id ? (
                          <div className="chronicle-chapter__forum"><span>Forum lié</span><strong>Accessible aux membres autorisés</strong></div>
                        ) : null}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : <div className="chronicle-directory-empty"><span aria-hidden="true">◇</span><div><strong>La progression n’a pas encore commencé.</strong><p>Les actes apparaîtront ici au fur et à mesure de la chronique.</p></div></div>}
          </article>
        </div>
      </section>
    </main>
  );
}
