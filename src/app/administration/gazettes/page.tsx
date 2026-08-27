import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { formatGazetteDate, gazettePublicationLabels, getAppRole, type GazettePublicationStatus } from "@/lib/gazettes";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminGazettesPage() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (claimsError || !claims || typeof claims.sub !== "string") redirect("/connexion?message=connexion-requise&retour=%2Fadministration%2Fgazettes");
  if (getAppRole(claims.app_metadata) !== "admin") redirect("/compte");

  const [gazettesResult, articlesResult] = await Promise.all([
    supabase.from("gazettes").select("id, slug, title, headline, edition, issue_number, publication_status, featured, published_at, updated_at").order("issue_number", { ascending: false }),
    supabase.from("gazette_articles").select("id, gazette_id"),
  ]);

  const rows = gazettesResult.data ?? [];
  const articleCount = new Map<string, number>();
  for (const article of articlesResult.data ?? []) articleCount.set(article.gazette_id, (articleCount.get(article.gazette_id) ?? 0) + 1);
  const published = rows.filter((row) => row.publication_status === "published").length;
  const drafts = rows.filter((row) => row.publication_status === "draft").length;
  const archived = rows.filter((row) => row.publication_status === "archived").length;

  return (
    <main className="site-shell admin-page admin-gazettes-page">
      <SiteHeader />
      <section className="admin-hero">
        <div className="content-frame admin-hero__layout">
          <div><p className="eyebrow">Administration · CMS</p><h1>Gazettes</h1><p>Composez les numéros, organisez leurs articles et choisissez précisément quand ils deviennent publics.</p></div>
          <div className="admin-hero__side"><span className="admin-role-badge">✦ Administrateur</span><Link className="button button--primary button--small" href="/administration/gazettes/nouveau">Nouvelle Gazette</Link></div>
        </div>
      </section>

      <section className="content-frame admin-workspace">
        {gazettesResult.error || articlesResult.error ? <div className="admin-alert" role="alert">Les Gazettes n’ont pas pu être chargées complètement depuis Supabase.</div> : null}
        <div className="admin-metrics" aria-label="Indicateurs Gazettes">
          <article className="admin-metric"><span>01</span><div><strong>{rows.length}</strong><small>Total</small></div></article>
          <article className="admin-metric"><span>02</span><div><strong>{drafts}</strong><small>Brouillons</small></div></article>
          <article className="admin-metric"><span>03</span><div><strong>{published}</strong><small>Publiées</small></div></article>
          <article className="admin-metric"><span>04</span><div><strong>{archived}</strong><small>Archivées</small></div></article>
        </div>

        <section className="admin-panel" aria-labelledby="admin-gazettes-list-title">
          <header className="admin-panel__head"><div><p className="eyebrow">Rédaction</p><h2 id="admin-gazettes-list-title">Tous les numéros</h2></div><Link className="text-link" href="/gazettes">Voir le public →</Link></header>
          {rows.length ? (
            <div className="admin-gazette-list">
              {rows.map((gazette) => {
                const publicationStatus = gazette.publication_status as GazettePublicationStatus;
                return (
                  <Link className="admin-gazette-row" href={`/administration/gazettes/${gazette.id}`} key={gazette.id}>
                    <span className="admin-gazette-row__issue">N° {String(gazette.issue_number).padStart(2, "0")}</span>
                    <div className="admin-gazette-row__main">
                      <div className="admin-gazette-row__badges"><span>{gazettePublicationLabels[publicationStatus]}</span>{gazette.featured ? <span>À la une</span> : null}</div>
                      <strong>{gazette.headline || gazette.title}</strong>
                      <small>{gazette.edition || gazette.slug}</small>
                    </div>
                    <div className="admin-gazette-row__stats"><strong>{articleCount.get(gazette.id) ?? 0}</strong><small>article{(articleCount.get(gazette.id) ?? 0) > 1 ? "s" : ""}</small></div>
                    <time dateTime={gazette.updated_at}>{formatGazetteDate(gazette.updated_at)}</time>
                    <span aria-hidden="true">→</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="admin-empty-state"><strong>Aucune Gazette en base.</strong><p>Créez le premier numéro. Il restera privé tant qu’il n’est pas publié.</p><Link className="button button--primary button--small" href="/administration/gazettes/nouveau">Créer la première Gazette</Link></div>
          )}
        </section>
      </section>
    </main>
  );
}
