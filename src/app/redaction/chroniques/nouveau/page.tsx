import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getCmsAccess } from "@/lib/cms-access";
import { createClient } from "@/lib/supabase/server";
import { createChronicleDraft } from "../../actions";

export const dynamic = "force-dynamic";

export default async function NewChronicleEditorialPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (claimsError || !claims || typeof claims.sub !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fredaction%2Fchroniques%2Fnouveau");
  }
  const access = await getCmsAccess(supabase, claims.sub, claims.app_metadata);
  if (!access.hasAccess || !access.canChronicles) redirect("/compte");

  return (
    <main className="site-shell redaction-page">
      <SiteHeader />
      <section className="content-frame redaction-editor-shell">
        <header className="redaction-editor-header">
          <div><p className="eyebrow">Espace rédaction · Chroniques</p><h1>Nouvelle chronique</h1></div>
          <div className="redaction-editor-header__actions"><Link className="button button--ghost button--small" href="/redaction">← Atelier éditorial</Link></div>
        </header>

        {query.erreur ? <div className="tools-notice tools-notice--error" role="alert">{query.erreur === "titre" ? "Le titre est obligatoire." : query.erreur === "couverture" ? "La couverture doit être un JPG, PNG ou WebP de 4 Mo maximum." : "Le brouillon n’a pas pu être créé."}</div> : null}

        <section className="redaction-editor-card">
          <header><p className="eyebrow">Brouillon</p><h2>Informations du dossier</h2></header>
          <form className="redaction-editor-form" action={createChronicleDraft} encType="multipart/form-data">
            <label className="redaction-field--wide"><span>Titre *</span><input name="title" maxLength={160} required /></label>
            <label><span>Slug · facultatif</span><input name="slug" maxLength={110} placeholder="généré automatiquement" /></label>
            <label><span>Statut narratif</span><select name="narrative_status" defaultValue="upcoming"><option value="upcoming">À venir</option><option value="open">Ouverte</option><option value="closed">Terminée</option></select></label>
            <label className="redaction-field--wide"><span>Sous-titre</span><input name="subtitle" maxLength={240} /></label>
            <label className="redaction-field--wide"><span>Synopsis</span><textarea name="synopsis" rows={7} maxLength={8000} placeholder="Le résumé public de la chronique…" /></label>
            <label className="redaction-field--wide"><span>Intention / accroche</span><textarea name="hook" rows={4} maxLength={5000} /></label>
            <label><span>Date de début</span><input name="started_at" type="date" /></label>
            <label><span>Lieu</span><input name="location" maxLength={200} /></label>
            <label><span>Organisation</span><input name="organizer" maxLength={160} /></label>
            <label><span>Tags</span><input name="tags" placeholder="aventure, politique, exploration" /></label>
            <div className="redaction-cover-field">
              <label><span>Importer une couverture</span><input name="cover_file" type="file" accept="image/jpeg,image/png,image/webp" /></label>
              <label><span>Ou utiliser une URL externe</span><input name="cover_url" type="url" maxLength={1200} placeholder="https://…" /></label>
              <small>JPG, PNG ou WebP · 4 Mo maximum. Utilisez uniquement une image que vous êtes autorisé à publier.</small>
            </div>
            <div className="redaction-editor-form__actions"><button className="button button--primary" type="submit">Créer le brouillon</button><Link className="button button--ghost" href="/redaction">Annuler</Link></div>
          </form>
        </section>
      </section>
    </main>
  );
}
