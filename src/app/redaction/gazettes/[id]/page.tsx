import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getCmsAccess } from "@/lib/cms-access";
import { gazetteArticleLabels, gazettePublicationLabels, type GazetteArticleKind, type GazettePublicationStatus } from "@/lib/gazettes";
import { createClient } from "@/lib/supabase/server";
import {
  createGazetteArticleDraft,
  deleteGazetteArticleDraft,
  transitionEditorialContent,
  updateGazetteArticleDraft,
  updateGazetteDraft,
} from "../../actions";

export const dynamic = "force-dynamic";

const eventLabels: Record<string, string> = {
  created: "Brouillon créé",
  submitted: "Soumis au staff",
  changes_requested: "Corrections demandées",
  staff_approved: "Validé par le staff",
  published: "Publié",
  archived: "Archivé",
  returned_to_draft: "Repassé en brouillon",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date(value));
}

function notice(message?: string, error?: string) {
  if (error === "titre") return { kind: "error", text: "Le grand titre est obligatoire." };
  if (error === "couverture") return { kind: "error", text: "La couverture doit être un JPG, PNG ou WebP de 4 Mo maximum." };
  if (error === "article") return { kind: "error", text: "L’article n’a pas pu être enregistré." };
  if (error) return { kind: "error", text: "La modification n’a pas pu être enregistrée." };
  const messages: Record<string, string> = {
    cree: "Le brouillon est créé. Vous pouvez maintenant construire le sommaire du numéro.",
    enregistre: "La gazette est enregistrée.",
    "article-cree": "Un nouvel article a été ajouté.",
    "article-enregistre": "L’article est enregistré.",
    "article-supprime": "L’article a été supprimé.",
  };
  return message && messages[message] ? { kind: "success", text: messages[message] } : null;
}

export default async function GazetteEditorialPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string; erreur?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (claimsError || !claims || typeof claims.sub !== "string") {
    redirect(`/connexion?message=connexion-requise&retour=${encodeURIComponent(`/redaction/gazettes/${id}`)}`);
  }
  const userId = claims.sub;
  const access = await getCmsAccess(supabase, userId, claims.app_metadata);
  if (!access.hasAccess || !access.canGazettes) redirect("/compte");

  const { data: gazette, error: gazetteError } = await supabase.from("gazettes").select(
    "id, slug, issue_number, title, edition, headline, excerpt, cover_image, highlights, publication_status, featured, created_by, submitted_at, staff_reviewed_at, admin_approved_at, review_note, updated_at"
  ).eq("id", id).maybeSingle();
  if (gazetteError || !gazette) notFound();

  const [articlesResult, eventsResult] = await Promise.all([
    supabase.from("gazette_articles").select("id, sort_order, kind, kicker, title, byline, aside, body, updated_at").eq("gazette_id", id).order("sort_order").order("created_at"),
    supabase.from("editorial_events").select("id, action, note, created_at").eq("content_type", "gazette").eq("content_id", id).order("created_at", { ascending: false }).limit(12),
  ]);

  const articles = articlesResult.data ?? [];
  const events = eventsResult.data ?? [];
  const status = gazette.publication_status as GazettePublicationStatus;
  const isOwner = gazette.created_by === userId;
  const canEdit = access.isAdmin
    || (access.cmsRole === "editor" && !["published", "archived"].includes(status))
    || (isOwner && ["draft", "changes_requested"].includes(status));
  const canSubmit = isOwner && ["draft", "changes_requested"].includes(status);
  const canReview = access.canReview && status === "submitted";
  const canPublish = access.isAdmin && status === "staff_approved";
  const pageNotice = notice(query.message, query.erreur);
  const coverImage = gazette.cover_image ?? "";
  const coverIsStored = coverImage.includes("/storage/v1/object/public/gazette-covers/");

  return (
    <main className="site-shell redaction-page">
      <SiteHeader />
      <section className="content-frame redaction-editor-shell">
        <header className="redaction-editor-header">
          <div>
            <p className="eyebrow">Espace rédaction · Gazettes</p>
            <h1>{gazette.headline}</h1>
          </div>
          <div className="redaction-editor-header__actions">
            <span className="status-pill">{gazettePublicationLabels[status]}</span>
            <Link className="button button--ghost button--small" href={`/gazettes/${gazette.slug}`}>Prévisualiser</Link>
            <Link className="button button--ghost button--small" href="/redaction">← Atelier</Link>
          </div>
        </header>

        {pageNotice ? <div className={`tools-notice${pageNotice.kind === "error" ? " tools-notice--error" : ""}`} role="status">{pageNotice.text}</div> : null}
        {!canEdit ? <div className="redaction-readonly">Ce numéro est actuellement verrouillé pour l’écriture. Son état éditorial doit changer avant une nouvelle modification.</div> : null}

        <div className="redaction-editor-grid">
          <div>
            <section className="redaction-editor-card">
              <header><p className="eyebrow">Numéro</p><h2>Informations publiques</h2></header>
              <form className="redaction-editor-form" action={updateGazetteDraft} encType="multipart/form-data">
                <input type="hidden" name="gazette_id" value={id} />
                <label className="redaction-field--wide"><span>Grand titre *</span><input name="headline" maxLength={220} required defaultValue={gazette.headline} disabled={!canEdit} /></label>
                <label><span>Titre de publication</span><input name="title" maxLength={160} defaultValue={gazette.title} disabled={!canEdit} /></label>
                <label><span>Numéro</span><input name="issue_number" type="number" min={0} max={9999} defaultValue={gazette.issue_number} disabled={!canEdit} /></label>
                <label><span>Édition / date</span><input name="edition" maxLength={180} defaultValue={gazette.edition} disabled={!canEdit} /></label>
                <label><span>Slug</span><input name="slug" maxLength={110} defaultValue={gazette.slug} disabled={!canEdit} /></label>
                <label className="redaction-field--wide"><span>Extrait / introduction *</span><textarea name="excerpt" rows={7} maxLength={8000} defaultValue={gazette.excerpt} disabled={!canEdit} /></label>
                <label className="redaction-field--wide"><span>Temps forts</span><input name="highlights" defaultValue={(gazette.highlights ?? []).join(", ")} disabled={!canEdit} /></label>
                <div className="redaction-cover-field">
                  {coverImage ? <div className="redaction-cover-preview"><img src={coverImage} alt="Aperçu de la couverture" /></div> : null}
                  <label><span>Importer / remplacer</span><input name="cover_file" type="file" accept="image/jpeg,image/png,image/webp" disabled={!canEdit} /></label>
                  <label><span>URL externe</span><input name="cover_url" type="url" maxLength={1200} defaultValue={coverIsStored ? "" : coverImage} disabled={!canEdit} /></label>
                  {coverImage && canEdit ? <label><input name="remove_cover" type="checkbox" /> Retirer la couverture actuelle</label> : null}
                </div>
                {canEdit ? <div className="redaction-editor-form__actions"><button className="button button--primary" type="submit">Enregistrer</button></div> : null}
              </form>
            </section>

            <section className="redaction-editor-card">
              <header><p className="eyebrow">Sommaire</p><h2>Articles du numéro</h2></header>
              {articles.length ? (
                <div className="redaction-child-list">
                  {articles.map((article) => {
                    const kind = article.kind as GazetteArticleKind;
                    return (
                      <article className="redaction-child-item" key={article.id}>
                        <header><strong>{article.title}</strong><span className="status-pill">{gazetteArticleLabels[kind] ?? article.kind}</span></header>
                        <form className="redaction-inline-form" action={updateGazetteArticleDraft}>
                          <input type="hidden" name="gazette_id" value={id} />
                          <input type="hidden" name="article_id" value={article.id} />
                          <label><span>Type</span><select name="kind" defaultValue={kind} disabled={!canEdit}>{Object.entries(gazetteArticleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                          <label><span>Ordre</span><input name="sort_order" type="number" min={0} defaultValue={article.sort_order} disabled={!canEdit} /></label>
                          <label><span>Sur-titre</span><input name="kicker" maxLength={120} defaultValue={article.kicker} disabled={!canEdit} /></label>
                          <label><span>Signature</span><input name="byline" maxLength={160} defaultValue={article.byline} disabled={!canEdit} /></label>
                          <label className="redaction-field--wide"><span>Titre</span><input name="title" maxLength={220} required defaultValue={article.title} disabled={!canEdit} /></label>
                          <label className="redaction-field--wide"><span>Encadré / aparté</span><textarea name="aside" rows={3} maxLength={4000} defaultValue={article.aside} disabled={!canEdit} /></label>
                          <label className="redaction-field--wide"><span>Corps de l’article</span><textarea name="body" rows={10} maxLength={50000} defaultValue={article.body} disabled={!canEdit} /></label>
                          {canEdit ? <div className="redaction-inline-form__actions"><button className="button button--primary button--small" type="submit">Enregistrer l’article</button><button className="button button--ghost button--small" type="submit" formAction={deleteGazetteArticleDraft}>Supprimer l’article</button></div> : null}
                        </form>
                      </article>
                    );
                  })}
                </div>
              ) : <div className="redaction-readonly">Aucun article pour le moment.</div>}
              {canEdit ? <form className="redaction-inline-form" action={createGazetteArticleDraft} style={{ marginTop: ".8rem" }}><input type="hidden" name="gazette_id" value={id} /><label className="redaction-field--wide"><span>Nouvel article</span><input name="title" maxLength={220} required placeholder="Titre du nouvel article" /></label><div className="redaction-inline-form__actions"><button className="button button--ghost button--small" type="submit">Ajouter un article</button></div></form> : null}
            </section>
          </div>

          <aside>
            <section className="redaction-editor-card">
              <header><p className="eyebrow">Workflow</p><h3>Validation éditoriale</h3></header>
              <div className="redaction-workflow">
                <div className="redaction-workflow__step"><strong>1 · Auteur</strong><p>{gazette.submitted_at ? `Soumis le ${formatDate(gazette.submitted_at)}` : "Le brouillon reste privé jusqu’à sa soumission."}</p></div>
                <div className="redaction-workflow__step"><strong>2 · Staff</strong><p>{gazette.staff_reviewed_at ? `Dernière revue le ${formatDate(gazette.staff_reviewed_at)}` : "Un éditeur doit relire et approuver le numéro."}</p></div>
                <div className="redaction-workflow__step"><strong>3 · Administration</strong><p>{gazette.admin_approved_at ? `Validation finale le ${formatDate(gazette.admin_approved_at)}` : "La publication finale reste réservée à un administrateur."}</p></div>
                {gazette.review_note ? <div className="redaction-workflow__note"><strong>Note de relecture</strong><p>{gazette.review_note}</p></div> : null}
              </div>
              <div className="redaction-editor-form__actions" style={{ marginTop: ".8rem" }}>
                {canSubmit ? <form action={transitionEditorialContent}><input type="hidden" name="content_type" value="gazette" /><input type="hidden" name="content_id" value={id} /><input type="hidden" name="action" value="submit" /><button className="button button--primary button--small" type="submit">Soumettre au staff</button></form> : null}
                {canReview ? <form action={transitionEditorialContent}><input type="hidden" name="content_type" value="gazette" /><input type="hidden" name="content_id" value={id} /><input type="hidden" name="action" value="staff_approved" /><button className="button button--primary button--small" type="submit">Valider côté staff</button></form> : null}
                {canReview ? <details><summary>Demander des corrections</summary><form action={transitionEditorialContent}><input type="hidden" name="content_type" value="gazette" /><input type="hidden" name="content_id" value={id} /><input type="hidden" name="action" value="changes_requested" /><textarea name="note" rows={4} minLength={3} maxLength={2000} required placeholder="Corrections à apporter…" /><button className="button button--ghost button--small" type="submit">Envoyer</button></form></details> : null}
                {canPublish ? <form action={transitionEditorialContent}><input type="hidden" name="content_type" value="gazette" /><input type="hidden" name="content_id" value={id} /><input type="hidden" name="action" value="publish" /><button className="button button--primary button--small" type="submit">Publier</button></form> : null}
              </div>
            </section>

            <section className="redaction-editor-card">
              <header><p className="eyebrow">Historique</p><h3>Journal éditorial</h3></header>
              <div className="redaction-workflow">
                {events.length ? events.map((event) => <div className="redaction-workflow__step" key={event.id}><strong>{eventLabels[event.action] ?? event.action}</strong><p>{formatDate(event.created_at)}{event.note ? ` · ${event.note}` : ""}</p></div>) : <p className="redaction-readonly">Aucun événement enregistré.</p>}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
