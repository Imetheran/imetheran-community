import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import { chronicleNarrativeLabels, chroniclePublicationLabels, getAppRole, type ChronicleNarrativeStatus, type ChroniclePublicationStatus } from "@/lib/chronicles";
import { AdminBreadcrumbs } from "../../admin-breadcrumbs";
import { ConfirmDeleteButton } from "../../confirm-delete-button";
import {
  addChronicleParticipant,
  createChronicleChapter,
  deleteChronicleChapter,
  featureChronicle,
  removeChronicleParticipant,
  setChroniclePublication,
  updateChronicle,
  updateChronicleChapter,
} from "../actions";

export const dynamic = "force-dynamic";

function notice(message?: string, error?: string) {
  if (error === "publication") return { kind: "error", text: "Ajoutez au minimum un titre et un synopsis avant publication." };
  if (error === "participant") return { kind: "error", text: "Le participant n’a pas pu être ajouté. Vérifiez le libellé et les doublons." };
  if (error === "chapitre") return { kind: "error", text: "L’acte n’a pas pu être enregistré." };
  if (error === "couverture") return { kind: "error", text: "La couverture n’a pas pu être enregistrée. Utilisez un JPG, PNG ou WebP de 4 Mo maximum." };
  if (error) return { kind: "error", text: "La modification n’a pas pu être enregistrée." };
  const messages: Record<string, string> = {
    cree: "Le brouillon est créé. Vous pouvez maintenant ajouter les actes et les participants.",
    enregistre: "Le dossier est enregistré.",
    draft: "La chronique est repassée en brouillon et n’est plus visible publiquement.",
    published: "La chronique est publiée.",
    archived: "La chronique est archivée et retirée du site public.",
    vedette: "Cette chronique est maintenant la chronique mise en avant.",
    "chapitre-cree": "Un nouvel acte a été ajouté.",
    "chapitre-enregistre": "L’acte est enregistré.",
    "chapitre-supprime": "L’acte a été supprimé.",
    participant: "Le participant a été ajouté.",
    "participant-retire": "Le participant a été retiré.",
  };
  return message && messages[message] ? { kind: "success", text: messages[message] } : null;
}

export default async function EditChroniclePage({
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
  if (claimsError || !claims || typeof claims.sub !== "string") redirect(`/connexion?message=connexion-requise&retour=${encodeURIComponent(`/administration/chroniques/${id}`)}`);
  if (getAppRole(claims.app_metadata) !== "admin") redirect("/compte");

  const { data: chronicle, error } = await supabase
    .from("chronicles")
    .select("id, slug, title, subtitle, synopsis, hook, narrative_status, publication_status, featured, cover_image, started_at, location, organizer, tags, published_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error || !chronicle) notFound();

  const [chaptersResult, participantsResult, charactersResult, topicsResult, boardsResult] = await Promise.all([
    supabase.from("chronicle_chapters").select("id, sort_order, act, title, summary, body, status, forum_topic_id").eq("chronicle_id", id).order("sort_order").order("created_at"),
    supabase.from("chronicle_participants").select("id, character_id, label, sort_order").eq("chronicle_id", id).order("sort_order").order("created_at"),
    supabase.from("characters").select("id, slug, name, status, visibility").order("name"),
    supabase.from("forum_topics").select("id, board_id, title, slug, status").order("last_activity_at", { ascending: false }).limit(150),
    supabase.from("forum_boards").select("id, title, slug").order("title"),
  ]);
  const chapters = chaptersResult.data ?? [];
  const participants = participantsResult.data ?? [];
  const characters = charactersResult.data ?? [];
  const topics = topicsResult.data ?? [];
  const boardMap = new Map((boardsResult.data ?? []).map((board) => [board.id, board]));
  const characterMap = new Map(characters.map((character) => [character.id, character]));
  const publicationStatus = chronicle.publication_status as ChroniclePublicationStatus;
  const narrativeStatus = chronicle.narrative_status as ChronicleNarrativeStatus;
  const pageNotice = notice(query.message, query.erreur);
  const coverImage = chronicle.cover_image ?? "";
  const coverIsStored = coverImage.includes("/storage/v1/object/public/chronicle-covers/");
  const documentedChapters = chapters.filter((chapter) => (chapter.summary ?? "").trim() || (chapter.body ?? "").trim()).length;
  const linkedChapters = chapters.filter((chapter) => chapter.forum_topic_id).length;
  const readiness = [
    { label: "Titre et synopsis", ready: Boolean(chronicle.title.trim() && chronicle.synopsis.trim()), detail: "obligatoire" },
    { label: "Couverture", ready: Boolean(coverImage), detail: "recommandée" },
    { label: "Actes documentés", ready: documentedChapters > 0, detail: `${documentedChapters}/${chapters.length}` },
    { label: "Participants", ready: participants.length > 0, detail: String(participants.length) },
    { label: "Liens vers le forum", ready: linkedChapters > 0, detail: `${linkedChapters}/${chapters.length}` },
  ];

  return (
    <main className="site-shell admin-page admin-chronicles-page">
      <SiteHeader />
      <section className="admin-hero">
        <div className="content-frame admin-hero__layout">
          <div><AdminBreadcrumbs items={[{ label: "Chroniques", href: "/administration/chroniques" }, { label: chronicle.title }]} /><p className="eyebrow">CMS · Chroniques</p><h1>{chronicle.title}</h1><p>{chronicle.subtitle || "Dossier narratif sans sous-titre."}</p></div>
          <div className="admin-hero__side"><span className="admin-role-badge">{chroniclePublicationLabels[publicationStatus]} · {chronicleNarrativeLabels[narrativeStatus]}</span><Link className="button button--ghost button--small" href={`/chroniques/${chronicle.slug}`}>{publicationStatus === "published" ? "Voir le public" : "Prévisualiser"}</Link><Link className="button button--ghost button--small" href="/administration/chroniques">← Liste</Link></div>
        </div>
      </section>

      <section className="content-frame admin-workspace">
        {pageNotice ? <div className={`admin-alert admin-alert--${pageNotice.kind}`} role="status">{pageNotice.text}</div> : null}

        <div className="admin-editor-sticky-bar" aria-label="Actions rapides de la chronique">
          <div className="admin-editor-sticky-bar__context"><strong>{chronicle.title}</strong><small>{chroniclePublicationLabels[publicationStatus]} · {chapters.length} acte{chapters.length > 1 ? "s" : ""}</small></div>
          <div className="admin-editor-sticky-bar__actions">
            <button className="button button--primary button--small" type="submit" form="chronicle-main-form">Enregistrer</button>
            <Link className="button button--ghost button--small" href={`/chroniques/${chronicle.slug}`}>{publicationStatus === "published" ? "Voir" : "Prévisualiser"}</Link>
            {publicationStatus !== "published" ? <form action={setChroniclePublication}><input type="hidden" name="chronicle_id" value={id} /><input type="hidden" name="publication_status" value="published" /><button className="button button--ghost button--small" type="submit">Publier</button></form> : <form action={setChroniclePublication}><input type="hidden" name="chronicle_id" value={id} /><input type="hidden" name="publication_status" value="draft" /><button className="button button--ghost button--small" type="submit">Brouillon</button></form>}
          </div>
        </div>

        <section className="admin-panel admin-chronicle-publish-panel">
          <header className="admin-panel__head"><div><p className="eyebrow">Publication</p><h2>État du dossier</h2></div>{chronicle.featured ? <span className="admin-panel__status">À la une</span> : null}</header>
          <div className="admin-editorial-readiness" aria-label="État de préparation éditoriale">
            {readiness.map((item) => <div className={item.ready ? "is-ready" : "is-missing"} key={item.label}><span aria-hidden="true">{item.ready ? "✓" : "○"}</span><strong>{item.label}</strong><small>{item.detail}</small></div>)}
          </div>
          <div className="admin-chronicle-publish-actions">
            {publicationStatus !== "published" ? <form action={setChroniclePublication}><input type="hidden" name="chronicle_id" value={id} /><input type="hidden" name="publication_status" value="published" /><button className="button button--primary button--small" type="submit">Publier</button></form> : null}
            {publicationStatus !== "draft" ? <form action={setChroniclePublication}><input type="hidden" name="chronicle_id" value={id} /><input type="hidden" name="publication_status" value="draft" /><button className="button button--ghost button--small" type="submit">Repasser en brouillon</button></form> : null}
            {publicationStatus !== "archived" ? <form action={setChroniclePublication}><input type="hidden" name="chronicle_id" value={id} /><input type="hidden" name="publication_status" value="archived" /><button className="button button--ghost button--small" type="submit">Archiver</button></form> : null}
            {publicationStatus === "published" && !chronicle.featured ? <form action={featureChronicle}><input type="hidden" name="chronicle_id" value={id} /><button className="button button--ghost button--small" type="submit">Mettre à la une</button></form> : null}
          </div>
          <p className="admin-chronicle-publish-note">Seuls le titre et le synopsis bloquent techniquement la publication. Les autres indicateurs servent de contrôle éditorial avant mise en ligne.</p>
        </section>

        <section className="admin-panel admin-chronicle-editor-panel">
          <header className="admin-panel__head"><div><p className="eyebrow">Dossier</p><h2>Informations publiques</h2></div><span className="admin-panel__status">{chronicle.slug}</span></header>
          <form id="chronicle-main-form" className="admin-chronicle-form" action={updateChronicle} encType="multipart/form-data">
            <input type="hidden" name="chronicle_id" value={id} />
            <input type="hidden" name="cover_image" value={coverImage} />
            <label className="admin-chronicle-field admin-chronicle-field--wide"><span>Titre *</span><input name="title" maxLength={160} required defaultValue={chronicle.title} /></label>
            <label className="admin-chronicle-field"><span>Slug</span><input name="slug" maxLength={110} defaultValue={chronicle.slug} /></label>
            <label className="admin-chronicle-field"><span>Statut narratif</span><select name="narrative_status" defaultValue={chronicle.narrative_status}><option value="upcoming">À venir</option><option value="open">Ouverte</option><option value="closed">Terminée</option></select></label>
            <label className="admin-chronicle-field admin-chronicle-field--wide"><span>Sous-titre</span><input name="subtitle" maxLength={240} defaultValue={chronicle.subtitle} /></label>
            <label className="admin-chronicle-field admin-chronicle-field--wide"><span>Synopsis *</span><textarea name="synopsis" rows={7} maxLength={8000} defaultValue={chronicle.synopsis} /></label>
            <label className="admin-chronicle-field admin-chronicle-field--wide"><span>Intention / accroche</span><textarea name="hook" rows={4} maxLength={5000} defaultValue={chronicle.hook} /></label>
            <label className="admin-chronicle-field"><span>Date de début</span><input name="started_at" type="date" defaultValue={chronicle.started_at ?? ""} /></label>
            <label className="admin-chronicle-field"><span>Lieu</span><input name="location" maxLength={200} defaultValue={chronicle.location} /></label>
            <label className="admin-chronicle-field"><span>Organisation</span><input name="organizer" maxLength={160} defaultValue={chronicle.organizer} /></label>
            <label className="admin-chronicle-field"><span>Tags</span><input name="tags" defaultValue={(chronicle.tags ?? []).join(", ")} /></label>

            <div className="admin-gazette-cover-field admin-editorial-cover-field">
              <div className="admin-gazette-cover-field__heading">
                <div><span>Image de couverture</span><small>{coverImage ? (coverIsStored ? "Stockée dans Imetheran" : "Image externe") : "Aucune couverture personnalisée"}</small></div>
                {coverImage ? <a href={coverImage} target="_blank" rel="noopener noreferrer">Ouvrir l’image ↗</a> : null}
              </div>
              {coverImage ? <div className="admin-gazette-cover-preview"><img src={coverImage} alt="Aperçu de la couverture actuelle" /></div> : <div className="admin-gazette-cover-preview admin-gazette-cover-preview--empty"><span>✦</span><strong>Aucune image de couverture</strong><small>Le visuel du thème actif sera utilisé sur la page publique.</small></div>}
              <div className="admin-gazette-cover-controls">
                <label><span>Importer / remplacer</span><input name="cover_file" type="file" accept="image/jpeg,image/png,image/webp" /><small>JPG, PNG ou WebP · 4 Mo maximum.</small></label>
                <label><span>URL externe · facultatif</span><input name="cover_url" type="url" maxLength={1200} defaultValue={coverIsStored ? "" : coverImage} placeholder="https://…" /><small>Utilisée uniquement si aucun fichier n’est importé.</small></label>
              </div>
              {coverImage ? <label className="admin-gazette-cover-remove"><input name="remove_cover" type="checkbox" /><span>Retirer la couverture actuelle au prochain enregistrement</span></label> : null}
              <p>Utilisez uniquement une image que vous êtes autorisé à publier.</p>
            </div>

            <div className="admin-chronicle-form__actions"><button className="button button--primary" type="submit">Enregistrer le dossier</button></div>
          </form>
        </section>

        <div className="admin-chronicle-two-column">
          <section className="admin-panel">
            <header className="admin-panel__head"><div><p className="eyebrow">Casting</p><h2>Participants</h2></div><span className="admin-panel__status">{participants.length}</span></header>
            <form className="admin-chronicle-inline-form" action={addChronicleParticipant}>
              <input type="hidden" name="chronicle_id" value={id} />
              <label><span>Personnage lié</span><select name="character_id" defaultValue=""><option value="">Aucun / libellé libre</option>{characters.map((character) => <option value={character.id} key={character.id}>{character.name} · {character.status}/{character.visibility}</option>)}</select></label>
              <label><span>Libellé public</span><input name="label" maxLength={120} placeholder="Vide = nom du personnage lié" /></label>
              <button className="button button--primary button--small" type="submit">Ajouter</button>
            </form>
            {participants.length ? <div className="admin-chronicle-participant-list">{participants.map((participant) => {
              const character = participant.character_id ? characterMap.get(participant.character_id) : null;
              return <div key={participant.id}><div><strong>{participant.label}</strong><small>{character ? `Lié à ${character.name}` : "Participant libre"}</small></div>{character ? <Link className="text-link" href={`/personnages/${character.slug}`}>Fiche →</Link> : null}<form action={removeChronicleParticipant}><input type="hidden" name="chronicle_id" value={id} /><input type="hidden" name="participant_id" value={participant.id} /><button className="admin-text-button" type="submit">Retirer</button></form></div>;
            })}</div> : <div className="admin-empty-state"><strong>Aucun participant.</strong><p>Vous pouvez lier une fiche existante ou utiliser un libellé libre pour un PNJ.</p></div>}
          </section>

          <section className="admin-panel">
            <header className="admin-panel__head"><div><p className="eyebrow">Progression</p><h2>Ajouter un acte</h2></div><span className="admin-panel__status">{chapters.length}</span></header>
            <form className="admin-chronicle-inline-form admin-chronicle-inline-form--chapter" action={createChronicleChapter}>
              <input type="hidden" name="chronicle_id" value={id} />
              <label><span>Titre du nouvel acte</span><input name="title" maxLength={180} required placeholder="Ex. Les lettres sans destinataire" /></label>
              <button className="button button--primary button--small" type="submit">Ajouter l’acte</button>
            </form>
            <p className="admin-chronicle-publish-note">L’acte est créé en « À venir ». Vous pourrez ensuite écrire son résumé, son contenu et le relier à un sujet du forum.</p>
          </section>
        </div>

        <section className="admin-panel">
          <header className="admin-panel__head"><div><p className="eyebrow">Scénario</p><h2>Actes et progression</h2></div><span className="admin-panel__status">{chapters.length} acte{chapters.length > 1 ? "s" : ""}</span></header>
          {chapters.length ? <div className="admin-chronicle-chapter-list">{chapters.map((chapter) => (
            <article className="admin-chronicle-chapter" key={chapter.id}>
              <form className="admin-chronicle-form" action={updateChronicleChapter}>
                <input type="hidden" name="chronicle_id" value={id} /><input type="hidden" name="chapter_id" value={chapter.id} />
                <label className="admin-chronicle-field"><span>Acte</span><input name="act" maxLength={80} defaultValue={chapter.act} /></label>
                <label className="admin-chronicle-field"><span>Ordre</span><input name="sort_order" type="number" min={0} defaultValue={chapter.sort_order} /></label>
                <label className="admin-chronicle-field admin-chronicle-field--wide"><span>Titre *</span><input name="title" maxLength={180} required defaultValue={chapter.title} /></label>
                <label className="admin-chronicle-field"><span>Progression</span><select name="status" defaultValue={chapter.status}><option value="upcoming">À venir</option><option value="active">En cours</option><option value="completed">Terminé</option></select></label>
                <label className="admin-chronicle-field"><span>Sujet forum lié</span><select name="forum_topic_id" defaultValue={chapter.forum_topic_id ?? ""}><option value="">Aucun</option>{topics.map((topic) => <option value={topic.id} key={topic.id}>{boardMap.get(topic.board_id)?.title ?? "Forum"} · {topic.title}</option>)}</select></label>
                <label className="admin-chronicle-field admin-chronicle-field--wide"><span>Résumé de l’acte</span><textarea name="summary" rows={4} maxLength={6000} defaultValue={chapter.summary} /></label>
                <label className="admin-chronicle-field admin-chronicle-field--wide"><span>Récit / compte rendu</span><textarea name="body" rows={12} maxLength={50000} defaultValue={chapter.body} /><small>Séparez les paragraphes par une ligne vide.</small></label>
                <div className="admin-chronicle-form__actions"><button className="button button--primary button--small" type="submit">Enregistrer l’acte</button></div>
              </form>
              <form className="admin-chronicle-delete-form" action={deleteChronicleChapter}>
                <input type="hidden" name="chronicle_id" value={id} /><input type="hidden" name="chapter_id" value={chapter.id} />
                <ConfirmDeleteButton className="admin-text-button admin-text-button--danger" label="Supprimer cet acte" confirmMessage={`Supprimer définitivement l’acte « ${chapter.title} » ? Son résumé, son récit et son lien éventuel vers le forum seront supprimés. Cette action est irréversible.`} />
              </form>
            </article>
          ))}</div> : <div className="admin-empty-state"><strong>Aucun acte pour le moment.</strong><p>Ajoutez le premier acte depuis le bloc Progression ci-dessus.</p></div>}
        </section>
      </section>
    </main>
  );
}
