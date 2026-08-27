import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/server";
import { chronicleNarrativeLabels, formatChronicleDate, type ChronicleNarrativeStatus } from "@/lib/chronicles";

export const dynamic = "force-dynamic";

type ChronicleRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  synopsis: string;
  hook: string;
  narrative_status: ChronicleNarrativeStatus;
  featured: boolean;
  cover_image: string;
  started_at: string | null;
  location: string;
  organizer: string;
  tags: string[];
  published_at: string | null;
};

export default async function ChroniquesPage() {
  const supabase = await createClient();
  const [chroniclesResult, chaptersResult, participantsResult] = await Promise.all([
    supabase
      .from("chronicles")
      .select("id, slug, title, subtitle, synopsis, hook, narrative_status, featured, cover_image, started_at, location, organizer, tags, published_at")
      .eq("publication_status", "published")
      .order("featured", { ascending: false })
      .order("published_at", { ascending: false }),
    supabase.from("chronicle_chapters").select("id, chronicle_id"),
    supabase.from("chronicle_participants").select("id, chronicle_id"),
  ]);

  const chronicles = (chroniclesResult.data ?? []) as ChronicleRow[];
  const chapterCount = new Map<string, number>();
  const participantCount = new Map<string, number>();
  for (const chapter of chaptersResult.data ?? []) chapterCount.set(chapter.chronicle_id, (chapterCount.get(chapter.chronicle_id) ?? 0) + 1);
  for (const participant of participantsResult.data ?? []) participantCount.set(participant.chronicle_id, (participantCount.get(participant.chronicle_id) ?? 0) + 1);
  const featured = chronicles.find((chronicle) => chronicle.featured) ?? chronicles[0] ?? null;

  return (
    <main className="site-shell chronicles-page chronicle-directory-page">
      <SiteHeader />

      <section className="chronicle-hero" aria-labelledby="chronicles-title">
        <div
          className="chronicle-hero__image"
          style={{ backgroundImage: featured?.cover_image ? `url(${featured.cover_image})` : "var(--hero-image)" }}
          aria-hidden="true"
        />
        <div className="chronicle-hero__veil" aria-hidden="true" />
        <div className="content-frame chronicle-hero__content">
          <div className="chronicle-hero__status">
            <span className="status-pill">{featured ? chronicleNarrativeLabels[featured.narrative_status] : "Bibliothèque"}</span>
            <span>{featured ? "Chronique mise en avant" : "Aucune chronique publiée"}</span>
          </div>
          <p className="eyebrow">Les fils rouges d’Imetheran</p>
          <h1 id="chronicles-title">{featured?.title ?? "Chroniques"}</h1>
          <p className="chronicle-hero__subtitle">{featured?.subtitle || "Scénarios, campagnes et récits communautaires"}</p>
          <p className="chronicle-hero__synopsis">
            {featured?.synopsis || "Les premières chroniques publiées par l’équipe apparaîtront ici avec leur progression, leurs participants et leurs actes."}
          </p>
          {featured ? (
            <div className="chronicle-hero__tags">{featured.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          ) : null}
          <div className="chronicle-directory-hero-actions">
            {featured ? <Link className="button button--primary" href={`/chroniques/${featured.slug}`}>Ouvrir le dossier</Link> : null}
            <ThemeToggle />
          </div>
        </div>
      </section>

      <section className="content-frame chronicle-directory" aria-labelledby="chronicle-directory-title">
        <header className="section-heading section-heading--row">
          <div>
            <p className="eyebrow">Bibliothèque narrative</p>
            <h2 id="chronicle-directory-title">Toutes les chroniques</h2>
            <p>Seules les chroniques explicitement publiées par l’administration sont visibles ici.</p>
          </div>
          <span className="status-pill status-pill--quiet">{chronicles.length} publiée{chronicles.length > 1 ? "s" : ""}</span>
        </header>

        {chronicles.length ? (
          <div className="chronicle-directory-grid">
            {chronicles.map((chronicle) => (
              <Link className="chronicle-directory-card" href={`/chroniques/${chronicle.slug}`} key={chronicle.id}>
                <div
                  className="chronicle-directory-card__art"
                  style={{ backgroundImage: chronicle.cover_image ? `url(${chronicle.cover_image})` : "var(--hero-image)" }}
                  aria-hidden="true"
                >
                  {chronicle.featured ? <span>À la une</span> : null}
                </div>
                <div className="chronicle-directory-card__body">
                  <div className="chronicle-directory-card__meta">
                    <span>{chronicleNarrativeLabels[chronicle.narrative_status]}</span>
                    <span>{formatChronicleDate(chronicle.started_at ?? chronicle.published_at)}</span>
                  </div>
                  <h3>{chronicle.title}</h3>
                  <p className="chronicle-directory-card__subtitle">{chronicle.subtitle}</p>
                  <p>{chronicle.synopsis}</p>
                  <div className="chronicle-directory-card__details">
                    <span>{chronicle.location || "Lieu à découvrir"}</span>
                    <span>{chapterCount.get(chronicle.id) ?? 0} acte{(chapterCount.get(chronicle.id) ?? 0) > 1 ? "s" : ""}</span>
                    <span>{participantCount.get(chronicle.id) ?? 0} participant{(participantCount.get(chronicle.id) ?? 0) > 1 ? "s" : ""}</span>
                  </div>
                  <div className="chronicle-directory-card__tags">{chronicle.tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</div>
                </div>
                <span className="chronicle-directory-card__arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="chronicle-directory-empty">
            <span aria-hidden="true">✦</span>
            <div><strong>Aucune chronique publiée pour le moment.</strong><p>Les dossiers en brouillon restent invisibles jusqu’à leur publication par l’équipe.</p></div>
          </div>
        )}
      </section>
    </main>
  );
}
