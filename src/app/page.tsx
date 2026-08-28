import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { chronicleNarrativeLabels, type ChronicleNarrativeStatus } from "@/lib/chronicles";
import { formatGazetteDate } from "@/lib/gazettes";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const forumCategories = [
  { title: "La Communauté", description: "Annonces, présentations et discussions générales accessibles en lecture aux invités.", meta: "Hors-RP · Lecture invités" },
  { title: "Univers & Rôleplay", description: "Préparation du jeu, personnages et recherches de partenaires dans un espace réservé aux membres.", meta: "Hors-RP · Membres" },
  { title: "Chroniques", description: "RP libres, scénarios fil rouge et scènes ciblées entre membres.", meta: "RP · Membres" },
  { title: "Evercold", description: "La campagne RP saisonnière active et ses intrigues associées.", meta: "RP · Campagne" },
  { title: "Final Fantasy XIV", description: "Actualités, gameplay, entraide et discussions hors-RP autour du jeu.", meta: "Hors-RP" },
];

const editorialItems = [
  { kicker: "Guides", title: "Préparer son personnage", text: "Retrouvez progressivement les bases du RP et les futurs modes d’emploi des outils communautaires.", href: "/guides" },
  { kicker: "Personnages", title: "Donner vie à son histoire", text: "Les fiches RP réunissent identité, histoire, accroches de jeu et relations de chaque personnage.", href: "/personnages" },
  { kicker: "Liens", title: "Tisser les relations", text: "Le sociogramme permet d’explorer les liens validés, alliances, rivalités et rencontres entre personnages.", href: "/liens" },
];

function formatHomeActivity(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(new Date(value));
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("fr") ?? "")
    .join("") || "IM";
}

export default async function Home() {
  const supabase = await createClient();
  const [
    topicsResult,
    boardsResult,
    gazetteResult,
    chronicleResult,
    openChroniclesResult,
    gazetteCountResult,
    characterCountResult,
    charactersResult,
  ] = await Promise.all([
    supabase.from("forum_topics").select("id, board_id, title, slug, last_activity_at, post_count").order("last_activity_at", { ascending: false }).limit(4),
    supabase.from("forum_boards").select("id, slug, title"),
    supabase
      .from("gazettes")
      .select("id, slug, title, headline, edition, issue_number, excerpt, cover_image, highlights, featured, published_at")
      .eq("publication_status", "published")
      .order("featured", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("chronicles")
      .select("id, slug, title, subtitle, synopsis, narrative_status, cover_image, location")
      .eq("publication_status", "published")
      .order("featured", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("chronicles").select("id", { count: "exact", head: true }).eq("publication_status", "published").eq("narrative_status", "open"),
    supabase.from("gazettes").select("id", { count: "exact", head: true }).eq("publication_status", "published"),
    supabase
      .from("characters")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .eq("visibility", "public")
      .eq("is_moderation_hidden", false),
    supabase
      .from("characters")
      .select("id, slug, name, epithet, short_summary, people, world, traits, is_featured, updated_at")
      .eq("status", "published")
      .eq("visibility", "public")
      .eq("is_moderation_hidden", false)
      .order("is_featured", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(3),
  ]);

  const topics = topicsResult.data ?? [];
  const boardMap = new Map((boardsResult.data ?? []).map((board) => [board.id, board]));
  const featuredGazette = gazetteResult.data;
  const featuredChronicle = chronicleResult.data;
  const openChronicleCount = openChroniclesResult.count ?? 0;
  const publishedGazetteCount = gazetteCountResult.count ?? 0;
  const publicCharacterCount = characterCountResult.count ?? 0;
  const liveCharacters = charactersResult.data ?? [];
  const gazetteHighlights = featuredGazette ? ((featuredGazette.highlights ?? []) as string[]) : [];

  let featuredChapterCount = 0;
  let featuredParticipantCount = 0;
  if (featuredChronicle) {
    const [chaptersResult, participantsResult] = await Promise.all([
      supabase.from("chronicle_chapters").select("id", { count: "exact", head: true }).eq("chronicle_id", featuredChronicle.id),
      supabase.from("chronicle_participants").select("id", { count: "exact", head: true }).eq("chronicle_id", featuredChronicle.id),
    ]);
    featuredChapterCount = chaptersResult.count ?? 0;
    featuredParticipantCount = participantsResult.count ?? 0;
  }

  return (
    <main className="site-shell">
      <SiteHeader />

      <section className="hero hero--portal" aria-labelledby="site-title">
        <div className="hero__image" aria-hidden="true" />
        <div className="hero__veil" aria-hidden="true" />
        <div className="hero__content content-frame">
          <div className="expansion-logo" aria-hidden="true" />
          <div className="hero__identity"><p className="brand-kicker">Communauté Final Fantasy XIV</p><h1 id="site-title" className="brand-title">Imetheran</h1><p className="brand-motto">Rôleplay · Partage · Immersion</p></div>
          <div className="hero__actions"><Link className="button button--primary" href="/forum">Entrer sur le forum</Link><a className="button button--ghost" href="#decouvrir">Découvrir la communauté</a></div>
          <ThemeToggle />
        </div>
      </section>

      <section className="home-section home-section--activity" aria-labelledby="activity-title">
        <div className="content-frame">
          <header className="section-heading section-heading--row"><div><p className="eyebrow">Le cœur de la communauté</p><h2 id="activity-title">En ce moment sur Imetheran</h2></div><Link className="text-link" href="/forum">Voir le forum <span aria-hidden="true">→</span></Link></header>
          <div className="activity-layout">
            <article className="panel panel--topics">
              <div className="panel__heading"><div><p className="panel__kicker">Discussions</p><h3>Derniers sujets visibles</h3></div><span className="status-pill status-pill--quiet">Activité récente</span></div>
              {topics.length ? <div className="home-live-topic-list">{topics.map((topic) => {
                const board = boardMap.get(topic.board_id);
                return <Link className="home-live-topic" href={board ? `/forum/${board.slug}/sujet/${topic.slug}` : "/forum"} key={topic.id}><span className="home-live-topic__mark" aria-hidden="true">◆</span><span className="home-live-topic__copy"><strong>{topic.title}</strong><small>{board?.title ?? "Forum"} · {topic.post_count} message{topic.post_count > 1 ? "s" : ""}</small></span><time dateTime={topic.last_activity_at}>{formatHomeActivity(topic.last_activity_at)}</time><span aria-hidden="true">→</span></Link>;
              })}</div> : <div className="empty-feed"><span className="empty-feed__mark" aria-hidden="true">✦</span><div><strong>Aucun sujet visible pour le moment.</strong><p>Les premières discussions accessibles à votre session apparaîtront ici automatiquement.</p></div></div>}
            </article>
            <aside className="activity-sidebar" aria-label="Informations à retenir">
              <article className="panel notice-card"><p className="panel__kicker">À retenir</p><h3>Imetheran ouvre ses portes</h3><p>Le numéro zéro de la Gazette et la première Chronique sont en ligne. Découvrez aussi l’esprit du projet et ce que nous attendons de la bêta.</p><Link className="text-link" href="/forum/annonces-informations/sujet/bienvenue-sur-imetheran">Lire l’annonce <span aria-hidden="true">→</span></Link></article>
              <article className="panel compact-status"><div><span className="status-dot" aria-hidden="true" /><span>Chroniques ouvertes</span><strong>{openChronicleCount}</strong></div><div><span className="status-dot status-dot--muted" aria-hidden="true" /><span>Gazettes publiées</span><strong>{publishedGazetteCount}</strong></div><div><span className="status-dot status-dot--muted" aria-hidden="true" /><span>Personnages publics</span><strong>{publicCharacterCount}</strong></div></article>
            </aside>
          </div>
        </div>
      </section>

      <section className="home-section home-section--gazette" aria-labelledby="gazette-title">
        <div className="content-frame">
          <header className="section-heading section-heading--row"><div><p className="eyebrow">La presse d’Imetheran</p><h2 id="gazette-title">Gazette à la une</h2></div><Link className="text-link" href="/gazettes">Toutes les gazettes <span aria-hidden="true">→</span></Link></header>
          {featuredGazette ? (
            <article className="gazette-feature">
              <div className="gazette-cover" style={featuredGazette.cover_image ? { backgroundImage: `linear-gradient(180deg, rgba(7,7,7,.08), rgba(7,7,7,.66)), url(${featuredGazette.cover_image})` } : { backgroundImage: "linear-gradient(180deg, rgba(7,7,7,.18), rgba(7,7,7,.7)), var(--hero-image)" }} aria-hidden="true">
                <div className="gazette-cover__topline"><span>Édition {String(featuredGazette.issue_number).padStart(2, "0")}</span><span>{formatGazetteDate(featuredGazette.published_at)}</span></div>
                <div className="gazette-cover__masthead">{featuredGazette.title}</div><div className="gazette-cover__headline">{featuredGazette.headline}</div><span className="gazette-cover__demo">Gazette publiée</span>
              </div>
              <div className="gazette-feature__story">
                <div className="gazette-feature__meta"><span className="status-pill">Publié</span><span>{featuredGazette.edition || `Édition ${String(featuredGazette.issue_number).padStart(2, "0")}`}</span></div>
                <p className="panel__kicker">Numéro mis en avant</p><h3>{featuredGazette.headline}</h3><p className="gazette-feature__excerpt">{featuredGazette.excerpt}</p>
                {gazetteHighlights.length ? <div className="gazette-feature__contents"><span>Dans ce numéro</span><ul>{gazetteHighlights.slice(0, 5).map((highlight) => <li key={highlight}>{highlight}</li>)}</ul></div> : null}
                <div className="gazette-feature__actions"><Link className="button button--primary" href={`/gazettes/${featuredGazette.slug}`}>Lire la Gazette</Link><span className="gazette-feature__cms-note">Édition communautaire</span></div>
              </div>
            </article>
          ) : <div className="empty-feed"><span className="empty-feed__mark" aria-hidden="true">✦</span><div><strong>Aucune Gazette publiée.</strong><p>Le premier numéro publié par la rédaction apparaîtra automatiquement ici.</p></div></div>}
        </div>
      </section>

      <section className="home-section home-section--chronicles" aria-labelledby="chronicles-title">
        <div className="content-frame">
          <header className="section-heading section-heading--row"><div><p className="eyebrow">Les fils rouges</p><h2 id="chronicles-title">Chronique mise en avant</h2></div><Link className="text-link" href="/chroniques">Toutes les chroniques <span aria-hidden="true">→</span></Link></header>
          {featuredChronicle ? <article className="chronicle-feature"><div className="chronicle-feature__art" style={{ backgroundImage: featuredChronicle.cover_image ? `linear-gradient(90deg, transparent 58%, var(--surface)), linear-gradient(180deg, rgba(0,0,0,.12), rgba(0,0,0,.56)), url(${featuredChronicle.cover_image})` : "linear-gradient(90deg, transparent 58%, var(--surface)), var(--hero-image)" }} aria-hidden="true" /><div className="chronicle-feature__body"><span className="status-pill">{chronicleNarrativeLabels[featuredChronicle.narrative_status as ChronicleNarrativeStatus]}</span><p className="chronicle-feature__meta">{featuredChronicle.subtitle || "Chronique communautaire"}</p><h3>{featuredChronicle.title}</h3><p>{featuredChronicle.synopsis}</p><div className="chronicle-feature__details"><span>{featuredChronicle.location || "Lieu à découvrir"}</span><span>{featuredChapterCount} acte{featuredChapterCount > 1 ? "s" : ""}</span><span>{featuredParticipantCount} participant{featuredParticipantCount > 1 ? "s" : ""}</span></div><Link className="button button--small" href={`/chroniques/${featuredChronicle.slug}`}>Ouvrir le dossier</Link></div></article> : <div className="empty-feed"><span className="empty-feed__mark" aria-hidden="true">✦</span><div><strong>Aucune chronique publiée.</strong><p>La première chronique publiée apparaîtra automatiquement ici.</p></div></div>}
        </div>
      </section>

      <section className="home-section home-section--forum" aria-labelledby="forum-title"><div className="content-frame"><header className="section-heading section-heading--center"><p className="eyebrow">Place publique</p><h2 id="forum-title">Le forum</h2><p>Des espaces hors-RP pour la communauté et la préparation du jeu, puis des sections RP dédiées aux scènes et campagnes.</p></header><div className="forum-grid">{forumCategories.map((category, index) => <Link className="forum-category" href="/forum" key={category.title}><span className="forum-category__index">{String(index + 1).padStart(2, "0")}</span><span className="forum-category__content"><small>{category.meta}</small><strong>{category.title}</strong><span>{category.description}</span></span><span className="forum-category__arrow" aria-hidden="true">→</span></Link>)}</div></div></section>

      <section className="home-section home-section--characters" aria-labelledby="characters-title">
        <div className="content-frame"><header className="section-heading section-heading--row"><div><p className="eyebrow">Carnet de rencontres</p><h2 id="characters-title">Personnages à découvrir</h2></div><Link className="text-link" href="/personnages">Tous les personnages <span aria-hidden="true">→</span></Link></header>
          {liveCharacters.length ? <div className="character-grid">{liveCharacters.map((character) => {
            const traits = (character.traits ?? []) as string[];
            return <Link className="character-card" href={`/personnages/${character.slug}`} key={character.id}><div className="character-card__portrait" aria-hidden="true"><span>{initials(character.name)}</span></div><div className="character-card__body"><small>{character.people || "Personnage"}{character.world ? ` · ${character.world}` : ""}</small><h3>{character.name}</h3><p className="character-card__epithet">{character.epithet || "Personnage d’Imetheran"}</p><p>{character.short_summary || "Une histoire à découvrir sur sa fiche."}</p><div className="character-card__tags">{traits.slice(0, 3).map((trait) => <span key={trait}>{trait}</span>)}</div></div><span className="character-card__arrow" aria-hidden="true">→</span></Link>;
          })}</div> : <div className="empty-feed"><span className="empty-feed__mark" aria-hidden="true">◎</span><div><strong>Aucun personnage public pour le moment.</strong><p>Les fiches publiées par les membres apparaîtront ici automatiquement.</p></div></div>}
        </div>
      </section>

      <section className="home-section home-section--editorial" aria-labelledby="editorial-title"><div className="content-frame"><header className="section-heading"><p className="eyebrow">Bibliothèque communautaire</p><h2 id="editorial-title">À lire et à découvrir</h2></header><div className="editorial-grid">{editorialItems.map((item) => <Link className="editorial-card" href={item.href} key={item.title}><small>{item.kicker}</small><h3>{item.title}</h3><p>{item.text}</p><span>Découvrir <span aria-hidden="true">→</span></span></Link>)}</div></div></section>

      <section id="decouvrir" className="home-section home-section--about" aria-labelledby="about-title"><div className="content-frame about-strip"><div><p className="eyebrow">Notre foyer</p><h2 id="about-title">Bienvenue sur Imetheran</h2></div><p>Une communauté francophone Final Fantasy XIV consacrée au rôleplay, aux récits et aux personnages. Un lieu pensé pour retrouver l’esprit des forums d’autrefois avec des outils communautaires modernes.</p><strong>À l’ancienne, comme autrefois.</strong></div></section>
      <footer className="site-footer content-frame"><p>Imetheran · Communauté non officielle Final Fantasy XIV</p><p>FINAL FANTASY XIV © SQUARE ENIX CO., LTD. Tous droits réservés.</p></footer>
    </main>
  );
}
