import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getCmsAccess } from "@/lib/cms-access";
import { chronicleChapterLabels, chronicleNarrativeLabels, chroniclePublicationLabels, type ChronicleChapterStatus, type ChronicleNarrativeStatus, type ChroniclePublicationStatus } from "@/lib/chronicles";
import { createClient } from "@/lib/supabase/server";
import {
  addChronicleParticipantDraft,
  createChronicleChapterDraft,
  deleteChronicleChapterDraft,
  removeChronicleParticipantDraft,
  transitionEditorialContent,
  updateChronicleChapterDraft,
  updateChronicleDraft,
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
  if (error === "titre") return { kind: "error", text: "Le titre est obligatoire." };
  if (error === "couverture") return { kind: "error", text: "La couverture doit être un JPG, PNG ou WebP de 4 Mo maximum." };
  if (error === "chapitre") return { kind: "error", text: "L’acte n’a pas pu être enregistré." };
  if (error === "participant") return { kind: "error", text: "Le participant n’a pas pu être enregistré." };
  if (error) return { kind: "error", text: "La modification n’a pas pu être enregistrée." };
  const messages: Record<string, string> = {
    cree: "Le brouillon est créé. Vous pouvez maintenant compléter les actes et les participants.",
    enregistre: "La chronique est enregistrée.",
    "chapitre-cree": "Un nouvel acte a été ajouté.",
    "chapitre-enregistre": "L’acte est enregistré.",
    "chapitre-supprime": "L’acte a été supprimé.",
    participant: "Le participant a été ajouté.",
    "participant-retire": "Le participant a été retiré.",
  };
  return message && messages[message] ? { kind: "success", text: messages[message] } : null;
}

export default async function ChronicleEditorialPage({
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
    redirect(`/connexion?message=connexion-requise&retour=${encodeURIComponent(`/redaction/chroniques/${id}`)}`);
  }
  const userId = claims.sub;
  const access = await getCmsAccess(supabase, userId, claims.app_metadata);
  if (!access.hasAccess || !access.canChronicles) redirect("/compte");

  const { data: chronicle, error: chronicleError } = await supabase.from("chronicles").select(
    "id, slug, title, subtitle, synopsis, hook, narrative_status, publication_status, featured, cover_image, started_at, location, organizer, tags, created_by, submitted_at, staff_reviewed_at, admin_approved_at, review_note, updated_at"
  ).eq("id", id).maybeSingle();
  if (chronicleError || !chronicle) notFound();

  const [chaptersResult, participantsResult, charactersResult, eventsResult] = await Promise.all([
    supabase.from("chronicle_chapters").select("id, sort_order, act, title, summary, body, status").eq("chronicle_id", id).order("sort_order").order("created_at"),
    supabase.from("chronicle_participants").select("id, character_id, label, sort_order").eq("chronicle_id", id).order("sort_order").order("created_at"),
    supabase.from("characters").select("id, name, status, visibility").eq("status", "published").order("name").limit(250),
    supabase.from("editorial_events").select("id, action, note, created_at").eq("content_type", "chronicle").eq("content_id", id).order("created_at", { ascending: false }).limit(12),
  ]);

  const chapters = chaptersResult.data ?? [];
  const participants = participantsResult.data ?? [];
  const characters = charactersResult.data ?? [];
  const events = eventsResult.data ?? [];
  const status = chronicle.publication_status as ChroniclePublicationStatus;
  const narrative = chronicle.narrative_status as ChronicleNarrativeStatus;
  const isOwner = chronicle.created_by === userId;
  const canEdit = access.isAdmin
    || (access.cmsRole === "editor" && !["published", "archived"].includes(status))
    || (isOwner && ["draft", "changes_requested"].includes(status));
  const canSubmit = isOwner && ["draft", "changes_requested"].includes(status);
  const canReview = access.canReview && status === "submitted";
  const canPublish = access.isAdmin && status === "staff_approved";
  const pageNotice = notice(query.message, query.erreur);
  const coverImage = chronicle.cover_image ?? "";
  const coverIsStored = coverImage.includes("/storage/v1/object/public/chronicle-covers/");

  return (
    <main className="site-shell redaction-page">
      <SiteHeader />
      <section className="content-frame redaction-editor-shell">
        <header className="redaction-editor-header">
          <div>
            <p className="eyebrow">Espace rédaction · Chroniques</p>
            <h1>{chronicle.title}</h1>
          </div>
          <div className="redaction-editor-header__actions">
            <span className="status-pill">{chroniclePublicationLabels[status]}</span>
            <Link className="button button--ghost button--small" href={`/chroniques/${chronicle.slug}`}>Prévisualiser</Link>
            <Link className="button button--ghost button--small" href="/redaction">← Atelier</Link>
          </div>
        </header>

        {pageNotice ? <div className={`tools-notice${pageNotice.kind === "error" ? " tools-notice--error" : ""}`} role="status">{pageNotice.text}</div> : null}
        {!canEdit ? <div className="redaction-readonly">Ce contenu est actuellement verrouillé pour l’écriture. Son état éditorial doit changer avant une nouvelle modification.</div> : null}

        <div className="redaction-editor-grid">
          <div>
            <section className="redaction-editor-card">
              <header><p className="eyebrow">Dossier public</p><h2>Informations de la chronique</h2></header>
              <form className="redaction-editor-form" action={updateChronicleDraft} encType="multipart/form-data">
                <input type="hidden" name="chronicle_id" value={id} />
                <label className="redaction-field--wide"><span>Titre *</span><input name="title" maxLength={160} required defaultValue={chronicle.title} disabled={!canEdit} /></label>
                <label><span>Slug</span><input name="slug" maxLength={110} defaultValue={chronicle.slug} disabled={!canEdit} /></label>
                <label><span>Statut narratif</span><select name="narrative_status" defaultValue={narrative} disabled={!canEdit}>{Object.entries(chronicleNarrativeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className="redaction-field--wide"><span>Sous-titre</span><input name="subtitle" maxLength={240} defaultValue={chronicle.subtitle} disabled={!canEdit} /></label>
                <label className="redaction-field--wide"><span>Synopsis *</span><textarea name="synopsis" rows={7} maxLength={8000} defaultValue={chronicle.synopsis} disabled={!canEdit} /></label>
                <label className="redaction-field--wide"><span>Intention / accroche</span><textarea name="hook" rows={4} maxLength={5000} defaultValue={chronicle.hook} disabled={!canEdit} /></label>
                <label><span>Date de début</span><input name="started_at" type="date" defaultValue={chronicle.started_at ?? ""} disabled={!canEdit} /></label>
                <label><span>Lieu</span><input name="location" maxLength={200} defaultValue={chronicle.location} disabled={!canEdit} /></label>
                <label><span>Organisation</span><input name="organizer" maxLength={160} defaultValue={chronicle.organizer} disabled={!canEdit} /></label>
                <label><span>Tags</span><input name="tags" defaultValue={(chronicle.tags ?? []).join(", ")} disabled={!canEdit} /></label>
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
              <header><p className="eyebrow">Déroulé</p><h2>Actes de la chronique</h2></header>
              {chapters.length ? (
                <div className="redaction-child-list">
                  {chapters.map((chapter) => {
                    const chapterStatus = chapter.status as ChronicleChapterStatus;
                    return (
                      <article className="redaction-child-item" key={chapter.id}>
                        <header><strong>{chapter.title}</strong><span className="status-pill">{chronicleChapterLabels[chapterStatus]}</span></header>
                        <form className="redaction-inline-form" action={updateChronicleChapterDraft}>
                          <input type="hidden" name="chronicle_id" value={id} />
                          <input type="hidden" name="chapter_id" value={chapter.id} />
                          <label><span>Acte</span><input name="act" maxLength={80} defaultValue={chapter.act} disabled={!canEdit} /></label>
                          <label><span>Ordre</span><input name="sort_order" type="number" min={0} defaultValue={chapter.sort_order} disabled={!canEdit} /></label>
                          <label className="redaction-field--wide"><span>Titre</span><input name="title" maxLength={180} required defaultValue={chapter.title} disabled={!canEdit} /></label>
                          <label><span>Statut</span><select name="status" defaultValue={chapterStatus} disabled={!canEdit}><option value="upcoming">À venir</option><option value="active">En cours</option><option value="completed">Terminé</option></select></label>
                          <label className="redaction-field--wide"><span>Résumé</span><textarea name="summary" rows={3} maxLength={6000} defaultValue={chapter.summary} disabled={!canEdit} /></label>
                          <label className="redaction-field--wide"><span>Corps / compte rendu</span><textarea name="body" rows={8} maxLength={50000} defaultValue={chapter.body} disabled={!canEdit} /></label>
                          {canEdit ? <div className="redaction-inline-form__actions"><button className="button button--primary button--small" type="submit">Enregistrer l’acte</button><button className="button button--ghost button--small" type="submit" formAction={deleteChronicleChapterDraft}>Supprimer l’acte</button></div> : null}
                        </form>
                      </article>
                    );
                  })}
                </div>
              ) : <div className="redaction-readonly">Aucun acte pour le moment.</div>}
              {canEdit ? <form className="redaction-inline-form" action={createChronicleChapterDraft} style={{ marginTop: ".8rem" }}><input type="hidden" name="chronicle_id" value={id} /><label className="redaction-field--wide"><span>Nouvel acte</span><input name="title" maxLength={180} required placeholder="Titre du nouvel acte" /></label><div className="redaction-inline-form__actions"><button className="button button--ghost button--small" type="submit">Ajouter un acte</button></div></form> : null}
            </section>

            <section className="redaction-editor-card">
              <header><p className="eyebrow">Casting</p><h2>Participants</h2></header>
              {canEdit ? (
                <form className="redaction-inline-form" action={addChronicleParticipantDraft}>
                  <input type="hidden" name="chronicle_id" value={id} />
                  <label><span>Personnage lié</span><select name="character_id" defaultValue=""><option value="">Aucun lien direct</option>{characters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}</select></label>
                  <label><span>Libellé affiché *</span><input name="label" maxLength={160} required placeholder="Nom ou rôle dans la chronique" /></label>
                  <div className="redaction-inline-form__actions"><button className="button button--ghost button--small" type="submit">Ajouter</button></div>
                </form>
              ) : null}
              <div className="redaction-participant-list">
                {participants.map((participant) => (
                  <article key={participant.id}><strong>{participant.label}</strong>{canEdit ? <form action={removeChronicleParticipantDraft}><input type="hidden" name="chronicle_id" value={id} /><input type="hidden" name="participant_id" value={participant.id} /><button className="button button--ghost button--small" type="submit">Retirer</button></form> : null}</article>
                ))}
              </div>
            </section>
          </div>

          <aside>
            <section className="redaction-editor-card">
              <header><p className="eyebrow">Workflow</p><h3>Validation éditoriale</h3></header>
              <div className="redaction-workflow">
                <div className="redaction-workflow__step"><strong>1 · Auteur</strong><p>{chronicle.submitted_at ? `Soumis le ${formatDate(chronicle.submitted_at)}` : "Le brouillon reste privé jusqu’à sa soumission."}</p></div>
                <div className="redaction-workflow__step"><strong>2 · Staff</strong><p>{chronicle.staff_reviewed_at ? `Dernière revue le ${formatDate(chronicle.staff_reviewed_at)}` : "Un éditeur doit relire et approuver le contenu."}</p></div>
                <div className="redaction-workflow__step"><strong>3 · Administration</strong><p>{chronicle.admin_approved_at ? `Validation finale le ${formatDate(chronicle.admin_approved_at)}` : "La publication finale reste réservée à un administrateur."}</p></div>
                {chronicle.review_note ? <div className="redaction-workflow__note"><strong>Note de relecture</strong><p>{chronicle.review_note}</p></div> : null}
              </div>
              <div className="redaction-editor-form__actions" style={{ marginTop: ".8rem" }}>
                {canSubmit ? <form action={transitionEditorialContent}><input type="hidden" name="content_type" value="chronicle" /><input type="hidden" name="content_id" value={id} /><input type="hidden" name="action" value="submit" /><button className="button button--primary button--small" type="submit">Soumettre au staff</button></form> : null}
                {canReview ? <form action={transitionEditorialContent}><input type="hidden" name="content_type" value="chronicle" /><input type="hidden" name="content_id" value={id} /><input type="hidden" name="action" value="staff_approved" /><button className="button button--primary button--small" type="submit">Valider côté staff</button></form> : null}
                {canReview ? <details><summary>Demander des corrections</summary><form action={transitionEditorialContent}><input type="hidden" name="content_type" value="chronicle" /><input type="hidden" name="content_id" value={id} /><input type="hidden" name="action" value="changes_requested" /><textarea name="note" rows={4} minLength={3} maxLength={2000} required placeholder="Corrections à apporter…" /><button className="button button--ghost button--small" type="submit">Envoyer</button></form></details> : null}
                {canPublish ? <form action={transitionEditorialContent}><input type="hidden" name="content_type" value="chronicle" /><input type="hidden" name="content_id" value={id} /><input type="hidden" name="action" value="publish" /><button className="button button--primary button--small" type="submit">Publier</button></form> : null}
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
