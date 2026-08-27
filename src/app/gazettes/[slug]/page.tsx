import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatGazetteDate, getAppRole, splitGazetteBody, type GazetteArticleKind } from "@/lib/gazettes";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type GazetteArticleRow = {
  id: string;
  kind: string;
  kicker: string | null;
  title: string;
  body: string | null;
  byline: string | null;
  aside: string | null;
  sort_order: number;
};

function ArticleBody({ article, columns = false }: { article: GazetteArticleRow; columns?: boolean }) {
  const paragraphs = splitGazetteBody(article.body);
  return <div className={columns ? "gazette-article__columns" : undefined}>{paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>;
}

function StandardArticle({ article }: { article: GazetteArticleRow }) {
  return (
    <section className="gazette-article gazette-article--column">
      {article.kicker ? <p className="gazette-article__kicker">{article.kicker}</p> : null}
      <h3>{article.title}</h3>
      {article.byline ? <p className="gazette-article__byline">Par {article.byline}</p> : null}
      {article.aside ? <blockquote>{article.aside}</blockquote> : null}
      <ArticleBody article={article} />
    </section>
  );
}

export default async function GazetteDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const isAdmin = getAppRole(claimsData?.claims?.app_metadata) === "admin";

  let gazetteQuery = supabase
    .from("gazettes")
    .select("id, slug, title, headline, edition, issue_number, excerpt, publication_status, featured, cover_image, highlights, published_at")
    .eq("slug", slug);
  if (!isAdmin) gazetteQuery = gazetteQuery.eq("publication_status", "published");

  const { data: gazette, error } = await gazetteQuery.maybeSingle();
  if (error || !gazette) notFound();

  const { data: articleRows } = await supabase
    .from("gazette_articles")
    .select("id, kind, kicker, title, body, byline, aside, sort_order")
    .eq("gazette_id", gazette.id)
    .order("sort_order");

  const articles = (articleRows ?? []) as GazetteArticleRow[];
  const lead = articles.find((article) => article.kind === "lead");
  const column = articles.find((article) => article.kind === "column");
  const brief = articles.find((article) => article.kind === "brief");
  const recipe = articles.find((article) => article.kind === "recipe");
  const quote = articles.find((article) => article.kind === "quote");
  const regular = articles.filter((article) => article.kind === "article");
  const highlights = (gazette.highlights ?? []) as string[];

  return (
    <main className="site-shell gazettes-page">
      <SiteHeader />

      <section className="gazette-hero" aria-labelledby="gazette-page-title">
        <div className="gazette-hero__image" style={gazette.cover_image ? { backgroundImage: `url(${gazette.cover_image})` } : undefined} aria-hidden="true" />
        <div className="gazette-hero__veil" aria-hidden="true" />
        <div className="content-frame gazette-hero__content">
          <p className="eyebrow">La Gazette d’Imetheran</p>
          <h1 id="gazette-page-title">Édition {String(gazette.issue_number).padStart(2, "0")}</h1>
          <p>{gazette.headline || gazette.title}</p>
          <div className="gazette-detail-actions">
            <ThemeToggle />
            <Link className="button button--ghost button--small" href="/gazettes">Toutes les Gazettes</Link>
            {isAdmin ? <Link className="button button--ghost button--small" href={`/administration/gazettes/${gazette.id}`}>Modifier</Link> : null}
          </div>
        </div>
      </section>

      <section className="gazette-library content-frame">
        {gazette.publication_status !== "published" && isAdmin ? <div className="admin-alert"><strong>Prévisualisation administrateur.</strong><span>Ce numéro est actuellement {gazette.publication_status} et reste invisible au public.</span></div> : null}

        <article className="gazette-issue">
          <header className="gazette-issue__header">
            <div className="gazette-issue__strapline">
              <span>Édition {String(gazette.issue_number).padStart(2, "0")}</span>
              <span>{formatGazetteDate(gazette.published_at)}</span>
              <span>{gazette.edition || "Imetheran · Éorzéa et au-delà"}</span>
            </div>
            <div className="gazette-issue__masthead">{gazette.title || "La Gazette d’Imetheran"}</div>
            <div className="gazette-issue__rule" aria-hidden="true"><span>✦</span></div>
          </header>

          <div className="gazette-issue__hero" style={gazette.cover_image ? { backgroundImage: `linear-gradient(180deg, rgba(11,8,5,.05), rgba(11,8,5,.64)), url(${gazette.cover_image})` } : undefined} aria-hidden="true">
            <div><span>À la une</span><strong>{gazette.headline || gazette.title}</strong></div>
          </div>

          <div className="gazette-issue__deck">
            <p>{gazette.excerpt || "Un nouveau numéro de la Gazette d’Imetheran."}</p>
            {highlights.length ? <ul>{highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul> : <ul><li>Chroniques communautaires</li></ul>}
          </div>

          {articles.length ? (
            <div className="gazette-paper">
              {lead ? (
                <section className="gazette-article gazette-article--lead">
                  {lead.kicker ? <p className="gazette-article__kicker">{lead.kicker}</p> : null}
                  <h2>{lead.title}</h2>
                  {lead.byline ? <p className="gazette-article__byline">Par {lead.byline}</p> : null}
                  {lead.aside ? <blockquote>{lead.aside}</blockquote> : null}
                  <ArticleBody article={lead} columns />
                </section>
              ) : <div />}

              <aside className="gazette-paper__sidebar">
                {column ? <StandardArticle article={column} /> : null}
                {brief ? (
                  <section className="gazette-article gazette-article--brief">
                    {brief.kicker ? <p className="gazette-article__kicker">{brief.kicker}</p> : null}
                    <h3>{brief.title}</h3>
                    {brief.byline ? <p className="gazette-article__byline">Par {brief.byline}</p> : null}
                    <ArticleBody article={brief} />
                    {brief.aside ? <div className="gazette-article__notice">{brief.aside}</div> : null}
                  </section>
                ) : null}
                {regular.map((article) => <StandardArticle article={article} key={article.id} />)}
              </aside>

              {recipe ? (
                <section className="gazette-article gazette-article--recipe">
                  <div>{recipe.kicker ? <p className="gazette-article__kicker">{recipe.kicker}</p> : null}<h3>{recipe.title}</h3>{recipe.byline ? <p className="gazette-article__byline">Par {recipe.byline}</p> : null}</div>
                  <div>{recipe.aside ? <div className="gazette-article__recipe-box">{recipe.aside}</div> : null}<ArticleBody article={recipe} /></div>
                </section>
              ) : null}

              {quote ? (
                <section className="gazette-article gazette-article--quote">
                  {quote.kicker ? <p className="gazette-article__kicker">{quote.kicker}</p> : null}
                  {quote.aside ? <blockquote>{quote.aside}</blockquote> : null}
                  <h3>{quote.title}</h3>
                  <ArticleBody article={quote} />
                </section>
              ) : null}
            </div>
          ) : (
            <div className="gazette-issue-empty"><strong>Ce numéro ne contient encore aucun article.</strong><p>La rédaction peut compléter le sommaire depuis l’administration.</p></div>
          )}

          <footer className="gazette-issue__footer">
            <span>Édition {String(gazette.issue_number).padStart(2, "0")}</span>
            <span>La Gazette d’Imetheran</span>
            <span>{gazette.featured ? "À la une" : "Archives"}</span>
          </footer>
        </article>
      </section>
    </main>
  );
}
