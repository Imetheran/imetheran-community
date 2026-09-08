import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { cmsRoleLabels, getCmsAccess } from "@/lib/cms-access";
import { chroniclePublicationLabels, type ChroniclePublicationStatus } from "@/lib/chronicles";
import { gazettePublicationLabels, type GazettePublicationStatus } from "@/lib/gazettes";
import { createClient } from "@/lib/supabase/server";
import { transitionEditorialContent } from "./actions";

export const dynamic = "force-dynamic";

type EditorialRow = {
  id: string;
  type: "chronicle" | "gazette";
  title: string;
  publication_status: string;
  created_by: string | null;
  updated_at: string;
  review_note: string;
};

const successMessages: Record<string, string> = {
  submitted: "Le contenu a été envoyé à la relecture du staff.",
  changes_requested: "La demande de corrections a été transmise à l’auteur.",
  staff_approved: "Le contenu est validé par le staff et attend la validation finale d’un administrateur.",
  published: "Le contenu est maintenant publié.",
  archived: "Le contenu a été archivé.",
  draft: "Le contenu est repassé en brouillon.",
};

const errorMessages: Record<string, string> = {
  donnees: "La demande éditoriale est invalide.",
  introuvable: "Le contenu n’est plus disponible ou vous n’y avez pas accès.",
  transition: "Cette action n’est pas disponible à cette étape du workflow.",
  note: "Ajoutez une courte note pour expliquer les corrections demandées.",
  publication: "Le contenu n’est pas suffisamment renseigné pour être publié.",
  "validation-staff": "Une validation du staff est requise avant la publication finale.",
  enregistrement: "Le changement d’état n’a pas pu être enregistré.",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(value));
}

function statusLabel(row: EditorialRow) {
  if (row.type === "chronicle") {
    return chroniclePublicationLabels[row.publication_status as ChroniclePublicationStatus] ?? row.publication_status;
  }
  return gazettePublicationLabels[row.publication_status as GazettePublicationStatus] ?? row.publication_status;
}

function editorHref(row: EditorialRow) {
  return row.type === "chronicle" ? `/redaction/chroniques/${row.id}` : `/redaction/gazettes/${row.id}`;
}

export default async function EditorialWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; erreur?: string }>;
}) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (claimsError || !claims || typeof claims.sub !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fredaction");
  }

  const userId = claims.sub;
  const access = await getCmsAccess(supabase, userId, claims.app_metadata);
  if (!access.hasAccess) redirect("/compte");

  const [chroniclesResult, gazettesResult] = await Promise.all([
    access.canChronicles
      ? supabase.from("chronicles").select("id, title, publication_status, created_by, updated_at, review_note").order("updated_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    access.canGazettes
      ? supabase.from("gazettes").select("id, headline, publication_status, created_by, updated_at, review_note").order("updated_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  const rows: EditorialRow[] = [
    ...((chroniclesResult.data ?? []).map((row) => ({
      id: row.id,
      type: "chronicle" as const,
      title: row.title,
      publication_status: row.publication_status,
      created_by: row.created_by,
      updated_at: row.updated_at,
      review_note: row.review_note ?? "",
    }))),
    ...((gazettesResult.data ?? []).map((row) => ({
      id: row.id,
      type: "gazette" as const,
      title: row.headline,
      publication_status: row.publication_status,
      created_by: row.created_by,
      updated_at: row.updated_at,
      review_note: row.review_note ?? "",
    }))),
  ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const mine = rows.filter((row) => row.created_by === userId || access.isAdmin);
  const toReview = access.canReview ? rows.filter((row) => row.publication_status === "submitted") : [];
  const finalApproval = access.isAdmin ? rows.filter((row) => row.publication_status === "staff_approved") : [];
  const success = query.message ? successMessages[query.message] : null;
  const error = query.erreur ? errorMessages[query.erreur] ?? "Une erreur est survenue." : null;
  const roleLabel = access.isAdmin ? "Administrateur" : access.cmsRole ? cmsRoleLabels[access.cmsRole] : "Rédaction";

  return (
    <main className="site-shell redaction-page">
      <SiteHeader />

      <section className="tools-hero redaction-hero">
        <div className="content-frame tools-hero__layout">
          <div>
            <p className="eyebrow">Espace rédaction</p>
            <h1>Atelier éditorial</h1>
            <p>Écrivez, relisez et faites avancer les publications d’Imetheran sans ouvrir les outils sensibles de l’administration.</p>
          </div>
          <div className="tools-hero__side">
            <span className="status-pill">{roleLabel}</span>
            <small>{access.canChronicles ? "Chroniques" : ""}{access.canChronicles && access.canGazettes ? " · " : ""}{access.canGazettes ? "Gazettes" : ""}</small>
          </div>
        </div>
      </section>

      <section className="content-frame redaction-workspace">
        {success ? <div className="tools-notice" role="status">{success}</div> : null}
        {error ? <div className="tools-notice tools-notice--error" role="alert">{error}</div> : null}
        {chroniclesResult.error || gazettesResult.error ? <div className="tools-notice tools-notice--error">Une partie des contenus n’a pas pu être chargée.</div> : null}

        <div className="redaction-metrics">
          <article><small>Mes contenus</small><strong>{mine.length}</strong><span>Brouillons et publications</span></article>
          <article><small>À relire</small><strong>{toReview.length}</strong><span>Soumis au staff</span></article>
          <article><small>Validation finale</small><strong>{finalApproval.length}</strong><span>Prêts pour l’administrateur</span></article>
        </div>

        <div className="redaction-create-actions">
          {access.canChronicles ? <Link className="button button--primary" href="/redaction/chroniques/nouveau">Nouvelle chronique</Link> : null}
          {access.canGazettes ? <Link className="button button--primary" href="/redaction/gazettes/nouveau">Nouvelle gazette</Link> : null}
          {access.isAdmin ? <Link className="button button--ghost" href="/administration/redaction">Gérer les accès</Link> : null}
        </div>

        {access.canReview && toReview.length > 0 ? (
          <section className="redaction-section" aria-labelledby="redaction-review-title">
            <header><div><p className="eyebrow">File éditoriale</p><h2 id="redaction-review-title">À relire par le staff</h2></div><span>{toReview.length}</span></header>
            <div className="redaction-review-grid">
              {toReview.map((row) => (
                <article className="redaction-review-card" key={`${row.type}-${row.id}`}>
                  <div className="redaction-card__meta"><span>{row.type === "chronicle" ? "Chronique" : "Gazette"}</span><span>{formatDate(row.updated_at)}</span></div>
                  <h3><Link href={editorHref(row)}>{row.title}</Link></h3>
                  <p>Relisez le contenu avant de le transmettre à l’administrateur ou de demander une correction.</p>
                  <div className="redaction-review-actions">
                    <form action={transitionEditorialContent}>
                      <input type="hidden" name="content_type" value={row.type} />
                      <input type="hidden" name="content_id" value={row.id} />
                      <input type="hidden" name="action" value="staff_approved" />
                      <button className="button button--primary button--small" type="submit">Valider côté staff</button>
                    </form>
                    <details>
                      <summary>Demander des corrections</summary>
                      <form action={transitionEditorialContent}>
                        <input type="hidden" name="content_type" value={row.type} />
                        <input type="hidden" name="content_id" value={row.id} />
                        <input type="hidden" name="action" value="changes_requested" />
                        <textarea name="note" rows={3} minLength={3} maxLength={2000} required placeholder="Expliquez brièvement ce qui doit être ajusté…" />
                        <button className="button button--ghost button--small" type="submit">Envoyer la demande</button>
                      </form>
                    </details>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {access.isAdmin && finalApproval.length > 0 ? (
          <section className="redaction-section" aria-labelledby="redaction-final-title">
            <header><div><p className="eyebrow">Validation finale</p><h2 id="redaction-final-title">Prêts à publier</h2></div><span>{finalApproval.length}</span></header>
            <div className="redaction-review-grid">
              {finalApproval.map((row) => (
                <article className="redaction-review-card redaction-review-card--ready" key={`${row.type}-${row.id}`}>
                  <div className="redaction-card__meta"><span>{row.type === "chronicle" ? "Chronique" : "Gazette"}</span><span>Validé par le staff</span></div>
                  <h3><Link href={editorHref(row)}>{row.title}</Link></h3>
                  <p>Le contenu a passé la relecture éditoriale. La publication reste une décision administrateur.</p>
                  <form action={transitionEditorialContent}>
                    <input type="hidden" name="content_type" value={row.type} />
                    <input type="hidden" name="content_id" value={row.id} />
                    <input type="hidden" name="action" value="publish" />
                    <button className="button button--primary button--small" type="submit">Publier définitivement</button>
                  </form>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="redaction-section" aria-labelledby="redaction-content-title">
          <header><div><p className="eyebrow">Bibliothèque</p><h2 id="redaction-content-title">{access.canReview ? "Contenus accessibles" : "Mes contenus"}</h2></div><span>{rows.length}</span></header>
          {rows.length ? (
            <div className="redaction-list">
              {rows.map((row) => {
                const canSubmit = row.created_by === userId && ["draft", "changes_requested"].includes(row.publication_status);
                return (
                  <article key={`${row.type}-${row.id}`}>
                    <Link className="redaction-list__main" href={editorHref(row)}>
                      <span className={`redaction-status redaction-status--${row.publication_status}`}>{statusLabel(row)}</span>
                      <div><small>{row.type === "chronicle" ? "Chronique" : "Gazette"}</small><strong>{row.title}</strong><span>Modifié {formatDate(row.updated_at)}</span></div>
                      <span aria-hidden="true">→</span>
                    </Link>
                    {row.publication_status === "changes_requested" && row.review_note ? <p className="redaction-list__note"><strong>Corrections demandées :</strong> {row.review_note}</p> : null}
                    {canSubmit ? (
                      <form className="redaction-list__action" action={transitionEditorialContent}>
                        <input type="hidden" name="content_type" value={row.type} />
                        <input type="hidden" name="content_id" value={row.id} />
                        <input type="hidden" name="action" value="submit" />
                        <button className="button button--ghost button--small" type="submit">Soumettre au staff</button>
                      </form>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="tools-empty"><span>✦</span><h3>Aucun contenu pour le moment</h3><p>Créez un premier brouillon. Rien ne sera visible publiquement avant les validations du staff et de l’administrateur.</p></div>
          )}
        </section>
      </section>
    </main>
  );
}
