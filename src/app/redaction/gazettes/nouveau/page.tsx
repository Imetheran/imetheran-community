import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getCmsAccess } from "@/lib/cms-access";
import { createClient } from "@/lib/supabase/server";
import { createGazetteDraft } from "../../actions";

export const dynamic = "force-dynamic";

export default async function NewGazetteEditorialPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (claimsError || !claims || typeof claims.sub !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fredaction%2Fgazettes%2Fnouveau");
  }
  const access = await getCmsAccess(supabase, claims.sub, claims.app_metadata);
  if (!access.hasAccess || !access.canGazettes) redirect("/compte");

  return (
    <main className="site-shell redaction-page">
      <SiteHeader />
      <section className="content-frame redaction-editor-shell">
        <header className="redaction-editor-header">
          <div><p className="eyebrow">Espace rédaction · Gazettes</p><h1>Nouvelle gazette</h1></div>
          <div className="redaction-editor-header__actions"><Link className="button button--ghost button--small" href="/redaction">← Atelier éditorial</Link></div>
        </header>

        {query.erreur ? <div className="tools-notice tools-notice--error" role="alert">{query.erreur === "titre" ? "Le titre principal est obligatoire." : query.erreur === "couverture" ? "La couverture doit être un JPG, PNG ou WebP de 4 Mo maximum." : "Le brouillon n’a pas pu être créé."}</div> : null}

        <section className="redaction-editor-card">
          <header><p className="eyebrow">Brouillon</p><h2>Informations du numéro</h2></header>
          <form className="redaction-editor-form" action={createGazetteDraft} encType="multipart/form-data">
            <label className="redaction-field--wide"><span>Grand titre *</span><input name="headline" maxLength={220} required /></label>
            <label><span>Titre de publication</span><input name="title" maxLength={160} defaultValue="La Gazette d’Imetheran" /></label>
            <label><span>Numéro · facultatif</span><input name="issue_number" type="number" min={0} max={9999} placeholder="automatique" /></label>
            <label><span>Édition / date</span><input name="edition" maxLength={180} /></label>
            <label><span>Slug · facultatif</span><input name="slug" maxLength={110} placeholder="généré automatiquement" /></label>
            <label className="redaction-field--wide"><span>Extrait / introduction</span><textarea name="excerpt" rows={7} maxLength={8000} placeholder="Texte d’introduction affiché avec le numéro…" /></label>
            <label className="redaction-field--wide"><span>Temps forts</span><input name="highlights" placeholder="titre 1, titre 2, titre 3" /></label>
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
