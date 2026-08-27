import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatGazetteDate } from "@/lib/gazettes";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function GazettesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gazettes")
    .select("id, slug, title, headline, edition, issue_number, excerpt, published_at, featured, cover_image, highlights")
    .eq("publication_status", "published")
    .order("featured", { ascending: false })
    .order("published_at", { ascending: false });

  const gazettes = data ?? [];

  return (
    <main className="site-shell gazettes-page">
      <SiteHeader />

      <section className="gazette-hero" aria-labelledby="gazettes-title">
        <div className="gazette-hero__image" aria-hidden="true" />
        <div className="gazette-hero__veil" aria-hidden="true" />
        <div className="content-frame gazette-hero__content">
          <p className="eyebrow">Presse communautaire</p>
          <h1 id="gazettes-title">Gazettes</h1>
          <p>
            Le journal rôleplay d’Imetheran : nouvelles, potins, recettes, événements,
            chroniques courtes et illustrations réunis en éditions publiées par la communauté.
          </p>
          <ThemeToggle />
        </div>
      </section>

      <section className="gazette-library content-frame" aria-labelledby="gazette-library-title">
        <header className="section-heading section-heading--row">
          <div>
            <p className="eyebrow">Archives de la rédaction</p>
            <h2 id="gazette-library-title">Feuilleter la Gazette</h2>
            <p>Chaque numéro publié depuis l’administration rejoint automatiquement cette bibliothèque.</p>
          </div>
          <span className="status-pill status-pill--quiet">{gazettes.length} publiée{gazettes.length > 1 ? "s" : ""}</span>
        </header>

        {error ? (
          <div className="chronicle-directory-empty" role="alert">
            <span aria-hidden="true">!</span>
            <div><strong>La bibliothèque est momentanément indisponible.</strong><p>Les Gazettes n’ont pas pu être chargées depuis Supabase.</p></div>
          </div>
        ) : gazettes.length ? (
          <div className="gazette-library__grid">
            {gazettes.map((gazette) => {
              const highlights = (gazette.highlights ?? []) as string[];
              const coverStyle = gazette.cover_image
                ? { backgroundImage: `linear-gradient(180deg, rgba(7,7,7,.08), rgba(7,7,7,.62)), url(${gazette.cover_image})` }
                : { backgroundImage: "linear-gradient(180deg, rgba(7,7,7,.18), rgba(7,7,7,.7)), var(--hero-image)" };

              return (
                <Link className="gazette-library-card" href={`/gazettes/${gazette.slug}`} key={gazette.id}>
                  <div className="gazette-library-card__image" style={coverStyle} aria-hidden="true" />
                  <div className="gazette-library-card__body">
                    <div className="gazette-library-card__meta">
                      <span>Édition {String(gazette.issue_number).padStart(2, "0")}</span>
                      <span>{formatGazetteDate(gazette.published_at)}</span>
                      {gazette.featured ? <span>À la une</span> : null}
                    </div>
                    <h2>{gazette.headline || gazette.title}</h2>
                    <p>{gazette.excerpt || "Un nouveau numéro de la Gazette d’Imetheran."}</p>
                    {highlights.length ? <ul>{highlights.slice(0, 4).map((highlight) => <li key={highlight}>{highlight}</li>)}</ul> : null}
                    <span className="gazette-library-card__note">Ouvrir le numéro →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="chronicle-directory-empty">
            <span aria-hidden="true">✦</span>
            <div><strong>Aucune Gazette publiée pour le moment.</strong><p>Les brouillons restent privés jusqu’à leur publication explicite par l’administration.</p></div>
          </div>
        )}
      </section>
    </main>
  );
}
