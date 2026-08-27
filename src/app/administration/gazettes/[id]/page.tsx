import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { formatGazetteDate, gazetteArticleLabels, gazettePublicationLabels, getAppRole, type GazetteArticleKind, type GazettePublicationStatus } from "@/lib/gazettes";
import { createClient } from "@/lib/supabase/server";
import { createGazetteArticle, deleteGazetteArticle, featureGazette, setGazettePublication, updateGazette, updateGazetteArticle } from "../actions";

export const dynamic = "force-dynamic";

function messageLabel(value?: string) {
  if (value === "cree") return "Le brouillon a été créé.";
  if (value === "enregistre") return "Le numéro a été enregistré.";
  if (value === "published") return "La Gazette est maintenant publique.";
  if (value === "draft") return "La Gazette est repassée en brouillon.";
  if (value === "archived") return "La Gazette a été archivée.";
  if (value === "vedette") return "Cette Gazette est maintenant à la une.";
  if (value === "article-cree") return "Un article a été ajouté.";
  if (value === "article-enregistre") return "L’article a été enregistré.";
  if (value === "article-supprime") return "L’article a été supprimé.";
  return null;
}

function errorLabel(value?: string) {
  if (!value) return null;
  if (value === "titre") return "Le titre de une est obligatoire.";
  if (value === "publication") return "Ajoutez au minimum un titre de une et un résumé avant publication.";
  if (value === "article") return "L’article n’a pas pu être enregistré.";
  return "L’opération n’a pas pu être terminée. Vérifiez les données puis réessayez.";
}

export default async function EditGazettePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ message?: string; erreur?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (claimsError || !claims || typeof claims.sub !== "string") redirect(`/connexion?message=connexion-requise&retour=${encodeURIComponent(`/administration/gazettes/${id}`)}`);
  if (getAppRole(claims.app_metadata) !== "admin") redirect("/compte");

  const [gazetteResult, articlesResult] = await Promise.all([
    supabase.from("gazettes").select("id, slug, title, headline, edition, issue_number, excerpt, publication_status, featured, cover_image, highlights, published_at, updated_at").eq("id", id).maybeSingle(),
    supabase.from("gazette_articles").select("id, gazette_id, kind, kicker, title, body, byline, aside, sort_order").eq("gazette_id", id).order("sort_order"),
  ]);

  const gazette = gazetteResult.data;
  if (!gazette) notFound();
  const articles = articlesResult.data ?? [];
  const publicationStatus = gazette.publication_status as GazettePublicationStatus;
  const message = messageLabel(query.message);
  const error = errorLabel(query.erreur);
  const highlights = ((gazette.highlights ?? []) as string[]).join(", ");

  return (
    <main className="site-shell admin-page admin-gazettes-page">
      <SiteHeader />
      <section className="admin-hero">
        <div className="content-frame admin-hero__layout">
          <div><p className="eyebrow">CMS · Gazette N° {String(gazette.issue_number).padStart(2, "0")}</p><h1>{gazette.headline || gazette.title}</h1><p>{gazettePublicationLabels[publicationStatus]} · dernière modification {formatGazetteDate(gazette.updated_at)}</p></div>
          <div className="admin-hero__side"><span className="admin-role-badge">{gazette.featured ? "✦ À la une" : `✦ ${gazettePublicationLabels[publicationStatus]}`}</span><Link className="button button--ghost button--small" href="/administration/gazettes">← Tous les numéros</Link>{publicationStatus === "published" ? <Link className="button button--ghost button--small" href={`/gazettes/${gazette.slug}`}>Voir le public</Link> : <Link className="button button--ghost button--small" href={`/gazettes/${gazette.slug}`}>Prévisualiser</Link>}</div>
        </div>
      </section>

      <section className="content-frame admin-workspace">
        {message ? <div className="admin-notice"><strong>{message}</strong></div> : null}
        {error ? <div className="admin-alert" role="alert"><strong>{error}</strong></div> : null}
        {gazetteResult.error || articlesResult.error ? <div className="admin-alert" role="alert">Certaines données n’ont pas pu être chargées depuis Supabase.</div> : null}

        <div className="admin-gazette-layout">
          <section className="admin-panel admin-chronicle-editor-panel">
            <header className="admin-panel__head"><div><p className="eyebrow">Numéro</p><h2>Informations éditoriales</h2></div><span className="admin-panel__status">{gazettePublicationLabels[publicationStatus]}</span></header>
            <form className="admin-chronicle-form" action={updateGazette}>
              <input type="hidden" name="gazette_id" value={gazette.id} />
              <label className="admin-chronicle-field"><span>Nom du journal</span><input name="title" maxLength={160} defaultValue={gazette.title} /></label>
              <label className="admin-chronicle-field"><span>Numéro</span><input name="issue_number" type="number" min={0} max={9999} defaultValue={gazette.issue_number} /></label>
              <label className="admin-chronicle-field admin-chronicle-field--wide"><span>Titre à la une *</span><input name="headline" maxLength={220} required defaultValue={gazette.headline} /></label>
              <label className="admin-chronicle-field"><span>Slug</span><input name="slug" maxLength={110} defaultValue={gazette.slug} /></label>
              <label className="admin-chronicle-field"><span>Édition / sous-titre</span><input name="edition" maxLength={180} defaultValue={gazette.edition ?? ""} /></label>
              <label className="admin-chronicle-field admin-chronicle-field--wide"><span>Résumé</span><textarea name="excerpt" rows={6} maxLength={8000} defaultValue={gazette.excerpt ?? ""} /></label>
              <label className="admin-chronicle-field admin-chronicle-field--wide"><span>Rubriques mises en avant</span><input name="highlights" defaultValue={highlights} /><small>Séparez les rubriques par des virgules.</small></label>
              <label className="admin-chronicle-field admin-chronicle-field--wide"><span>Image de couverture officielle FFXIV</span><input name="cover_image" type="url" maxLength={1200} defaultValue={gazette.cover_image ?? ""} /><small>Uniquement une image officielle Final Fantasy XIV.</small></label>
              <div className="admin-chronicle-form__actions"><button className="button button--primary" type="submit">Enregistrer le numéro</button></div>
            </form>
          </section>

          <aside className="admin-panel admin-gazette-publication-panel">
            <header className="admin-panel__head"><div><p className="eyebrow">Diffusion</p><h2>Publication</h2></div></header>
            <div className="admin-gazette-publication-status"><strong>{gazettePublicationLabels[publicationStatus]}</strong><span>{gazette.published_at ? `Publié le ${formatGazetteDate(gazette.published_at)}` : "Jamais publié"}</span></div>
            <div className="admin-gazette-publication-actions">
              {publicationStatus !== "published" ? <form action={setGazettePublication}><input type="hidden" name="gazette_id" value={gazette.id} /><input type="hidden" name="publication_status" value="published" /><button className="button button--primary button--small" type="submit">Publier</button></form> : null}
              {publicationStatus !== "draft" ? <form action={setGazettePublication}><input type="hidden" name="gazette_id" value={gazette.id} /><input type="hidden" name="publication_status" value="draft" /><button className="button button--ghost button--small" type="submit">Repasser en brouillon</button></form> : null}
              {publicationStatus !== "archived" ? <form action={setGazettePublication}><input type="hidden" name="gazette_id" value={gazette.id} /><input type="hidden" name="publication_status" value="archived" /><button className="button button--ghost button--small" type="submit">Archiver</button></form> : null}
              {publicationStatus === "published" && !gazette.featured ? <form action={featureGazette}><input type="hidden" name="gazette_id" value={gazette.id} /><button className="button button--ghost button--small" type="submit">Mettre à la une</button></form> : null}
            </div>
            <p className="admin-gazette-publication-note">Un brouillon ou un numéro archivé n’est jamais visible publiquement. La mise à la une est réservée aux numéros publiés.</p>
          </aside>
        </div>

        <section className="admin-panel" aria-labelledby="gazette-articles-title">
          <header className="admin-panel__head"><div><p className="eyebrow">Composition</p><h2 id="gazette-articles-title">Articles du numéro</h2></div><span className="admin-panel__status">{articles.length} article{articles.length > 1 ? "s" : ""}</span></header>

          {articles.length ? (
            <div className="admin-gazette-articles">
              {articles.map((article) => {
                const kind = article.kind as GazetteArticleKind;
                return (
                  <article className="admin-gazette-article-card" key={article.id}>
                    <form className="admin-gazette-article-form" action={updateGazetteArticle}>
                      <input type="hidden" name="gazette_id" value={gazette.id} />
                      <input type="hidden" name="article_id" value={article.id} />
                      <div className="admin-gazette-article-heading"><span>#{String(article.sort_order + 1).padStart(2, "0")}</span><strong>{article.title}</strong><small>{gazetteArticleLabels[kind] ?? "Article"}</small></div>
                      <label><span>Type</span><select name="kind" defaultValue={article.kind}>{Object.entries(gazetteArticleLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
                      <label><span>Ordre</span><input name="sort_order" type="number" min={0} defaultValue={article.sort_order} /></label>
                      <label className="admin-gazette-article-wide"><span>Rubrique / kicker</span><input name="kicker" maxLength={120} defaultValue={article.kicker ?? ""} /></label>
                      <label className="admin-gazette-article-wide"><span>Titre *</span><input name="title" maxLength={220} required defaultValue={article.title} /></label>
                      <label><span>Signature</span><input name="byline" maxLength={160} defaultValue={article.byline ?? ""} placeholder="La rédaction" /></label>
                      <label className="admin-gazette-article-wide"><span>Encadré / citation</span><textarea name="aside" rows={3} maxLength={8000} defaultValue={article.aside ?? ""} /></label>
                      <label className="admin-gazette-article-wide"><span>Corps de l’article</span><textarea name="body" rows={10} maxLength={50000} defaultValue={article.body ?? ""} /><small>Séparez les paragraphes par une ligne vide.</small></label>
                      <div className="admin-gazette-article-actions"><button className="button button--primary button--small" type="submit">Enregistrer l’article</button></div>
                    </form>
                    <form action={deleteGazetteArticle}><input type="hidden" name="gazette_id" value={gazette.id} /><input type="hidden" name="article_id" value={article.id} /><button className="admin-gazette-delete" type="submit">Supprimer cet article</button></form>
                  </article>
                );
              })}
            </div>
          ) : <div className="admin-empty-state"><strong>Aucun article dans ce numéro.</strong><p>Ajoutez un premier bloc puis choisissez son format.</p></div>}

          <form className="admin-gazette-add-article" action={createGazetteArticle}>
            <input type="hidden" name="gazette_id" value={gazette.id} />
            <label><span>Titre du nouvel article</span><input name="title" maxLength={220} required placeholder="Titre provisoire" /></label>
            <button className="button button--primary button--small" type="submit">Ajouter un article</button>
          </form>
        </section>
      </section>
    </main>
  );
}
