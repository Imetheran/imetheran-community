import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recherche",
  description: "Recherchez dans le forum, les personnages, les chroniques et les gazettes d’Imetheran.",
};

type BoardRow = { id: string; slug: string; title: string };
type TopicRow = { id: string; board_id: string; slug: string; title: string; excerpt: string; tags: string[]; rp_location: string | null; last_activity_at: string };
type CharacterRow = { id: string; slug: string; name: string; epithet: string; short_summary: string; people: string; occupation: string; traits: string[]; updated_at: string };
type ChronicleRow = { id: string; slug: string; title: string; subtitle: string; synopsis: string; hook: string; location: string; organizer: string; tags: string[]; updated_at: string };
type GazetteRow = { id: string; slug: string; issue_number: number; title: string; edition: string; headline: string; excerpt: string; highlights: string[]; updated_at: string };

type SearchHit = {
  id: string;
  kind: string;
  title: string;
  excerpt: string;
  href: string;
  meta: string;
  updatedAt: string;
  score: number;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr");
}

function scoreMatch(query: string, title: string, fields: Array<string | null | undefined>) {
  const needle = normalize(query).trim();
  if (!needle) return 0;
  const tokens = needle.split(/\s+/).filter(Boolean);
  const normalizedTitle = normalize(title);
  const haystack = normalize([title, ...fields.filter(Boolean)].join(" "));
  if (!tokens.every((token) => haystack.includes(token))) return 0;
  if (normalizedTitle === needle) return 10;
  if (normalizedTitle.startsWith(needle)) return 8;
  if (normalizedTitle.includes(needle)) return 6;
  if (tokens.every((token) => normalizedTitle.includes(token))) return 4;
  return 2;
}

function sortHits(hits: SearchHit[]) {
  return hits.sort((a, b) => b.score - a.score || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 18);
}

function ResultsGroup({ title, hits }: { title: string; hits: SearchHit[] }) {
  if (!hits.length) return null;
  return (
    <section className="search-group">
      <header className="search-group__heading"><h2>{title}</h2><span>{hits.length}</span></header>
      <div className="search-results">
        {hits.map((hit) => (
          <Link className="search-result" href={hit.href} key={`${hit.kind}-${hit.id}`}>
            <div className="search-result__meta"><span>{hit.kind}</span><small>{hit.meta}</small></div>
            <h3>{hit.title}</h3>
            <p>{hit.excerpt || "Ouvrir ce contenu sur Imetheran."}</p>
            <span className="text-link">Consulter →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const query = String(params.q ?? "").trim().slice(0, 100);
  const supabase = await createClient();

  let forumHits: SearchHit[] = [];
  let characterHits: SearchHit[] = [];
  let chronicleHits: SearchHit[] = [];
  let gazetteHits: SearchHit[] = [];
  let loadError = false;

  if (query.length >= 2) {
    const [boardsResult, topicsResult, charactersResult, chroniclesResult, gazettesResult] = await Promise.all([
      supabase.from("forum_boards").select("id, slug, title").order("sort_order").limit(100),
      supabase.from("forum_topics").select("id, board_id, slug, title, excerpt, tags, rp_location, last_activity_at").order("last_activity_at", { ascending: false }).limit(300),
      supabase.from("characters").select("id, slug, name, epithet, short_summary, people, occupation, traits, updated_at").order("updated_at", { ascending: false }).limit(300),
      supabase.from("chronicles").select("id, slug, title, subtitle, synopsis, hook, location, organizer, tags, updated_at").order("updated_at", { ascending: false }).limit(200),
      supabase.from("gazettes").select("id, slug, issue_number, title, edition, headline, excerpt, highlights, updated_at").order("updated_at", { ascending: false }).limit(200),
    ]);

    loadError = Boolean(boardsResult.error || topicsResult.error || charactersResult.error || chroniclesResult.error || gazettesResult.error);
    const boards = (boardsResult.data ?? []) as BoardRow[];
    const boardMap = new Map(boards.map((board) => [board.id, board]));

    forumHits = sortHits(((topicsResult.data ?? []) as TopicRow[]).map((topic) => {
      const board = boardMap.get(topic.board_id);
      const score = scoreMatch(query, topic.title, [topic.excerpt, topic.rp_location, ...(topic.tags ?? [])]);
      return {
        id: topic.id,
        kind: board?.slug === "guide-du-roliste" ? "Guide" : "Forum",
        title: topic.title,
        excerpt: topic.excerpt,
        href: board ? `/forum/${board.slug}/sujet/${topic.slug}` : "/forum",
        meta: board?.title ?? "Forum",
        updatedAt: topic.last_activity_at,
        score,
      };
    }).filter((hit) => hit.score > 0));

    characterHits = sortHits(((charactersResult.data ?? []) as CharacterRow[]).map((character) => ({
      id: character.id,
      kind: "Personnage",
      title: character.name,
      excerpt: character.short_summary || character.epithet,
      href: `/personnages/${character.slug}`,
      meta: [character.people, character.occupation].filter(Boolean).join(" · ") || "Fiche personnage",
      updatedAt: character.updated_at,
      score: scoreMatch(query, character.name, [character.epithet, character.short_summary, character.people, character.occupation, ...(character.traits ?? [])]),
    })).filter((hit) => hit.score > 0));

    chronicleHits = sortHits(((chroniclesResult.data ?? []) as ChronicleRow[]).map((chronicle) => ({
      id: chronicle.id,
      kind: "Chronique",
      title: chronicle.title,
      excerpt: chronicle.synopsis || chronicle.subtitle,
      href: `/chroniques/${chronicle.slug}`,
      meta: [chronicle.location, chronicle.organizer].filter(Boolean).join(" · ") || "Chronique",
      updatedAt: chronicle.updated_at,
      score: scoreMatch(query, chronicle.title, [chronicle.subtitle, chronicle.synopsis, chronicle.hook, chronicle.location, chronicle.organizer, ...(chronicle.tags ?? [])]),
    })).filter((hit) => hit.score > 0));

    gazetteHits = sortHits(((gazettesResult.data ?? []) as GazetteRow[]).map((gazette) => ({
      id: gazette.id,
      kind: "Gazette",
      title: gazette.headline || gazette.title,
      excerpt: gazette.excerpt,
      href: `/gazettes/${gazette.slug}`,
      meta: `Numéro ${String(gazette.issue_number).padStart(2, "0")}${gazette.edition ? ` · ${gazette.edition}` : ""}`,
      updatedAt: gazette.updated_at,
      score: scoreMatch(query, `${gazette.title} ${gazette.headline}`, [gazette.edition, gazette.excerpt, ...(gazette.highlights ?? [])]),
    })).filter((hit) => hit.score > 0));
  }

  const total = forumHits.length + characterHits.length + chronicleHits.length + gazetteHits.length;

  return (
    <main className="site-shell search-page">
      <SiteHeader />

      <section className="tools-hero tools-hero--search">
        <div className="content-frame tools-hero__layout">
          <div>
            <p className="eyebrow">Explorer Imetheran</p>
            <h1>Recherche</h1>
            <p>Forum et guides, personnages, chroniques et gazettes — avec les mêmes règles de visibilité que partout ailleurs sur le site.</p>
          </div>
        </div>
      </section>

      <section className="content-frame tools-workspace search-workspace">
        <form className="global-search-form" method="get" action="/recherche">
          <label htmlFor="global-search"><span>Que cherchez-vous ?</span></label>
          <div>
            <input id="global-search" name="q" type="search" minLength={2} maxLength={100} defaultValue={query} placeholder="Personnage, sujet, lieu, chronique…" autoFocus />
            <button className="button button--primary" type="submit">Rechercher</button>
          </div>
        </form>

        {query.length > 0 && query.length < 2 ? <div className="tools-notice tools-notice--error">Saisissez au moins deux caractères.</div> : null}
        {loadError ? <div className="tools-notice tools-notice--error">Une partie des résultats n’a pas pu être chargée.</div> : null}

        {query.length >= 2 ? (
          <>
            <header className="search-summary">
              <div><p className="eyebrow">Résultats</p><h2>{total ? `${total} résultat${total > 1 ? "s" : ""} pour « ${query} »` : `Aucun résultat pour « ${query} »`}</h2></div>
              {total ? <span className="status-pill">Visibilité respectée</span> : null}
            </header>
            {total ? (
              <div className="search-groups">
                <ResultsGroup title="Forum & Guides" hits={forumHits} />
                <ResultsGroup title="Personnages" hits={characterHits} />
                <ResultsGroup title="Chroniques" hits={chronicleHits} />
                <ResultsGroup title="Gazettes" hits={gazetteHits} />
              </div>
            ) : (
              <div className="tools-empty"><span aria-hidden="true">⌕</span><h3>Rien de correspondant</h3><p>Essayez un nom plus court, un lieu, un tag ou un terme utilisé dans le forum.</p><Link className="button button--ghost" href="/forum">Parcourir le forum</Link></div>
            )}
          </>
        ) : (
          <div className="search-start-grid">
            <article><strong>Forum & Guides</strong><p>Sujets, résumés, tags et lieux RP visibles pour votre compte.</p></article>
            <article><strong>Personnages</strong><p>Noms, épithètes, peuples, métiers, traits et résumés de fiches.</p></article>
            <article><strong>Chroniques & Gazettes</strong><p>Titres, synopsis, lieux, éditions et contenus éditoriaux publiés.</p></article>
          </div>
        )}
      </section>
    </main>
  );
}
