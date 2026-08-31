import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getAppRole } from "@/lib/gazettes";
import { createClient } from "@/lib/supabase/server";
import { createGazette } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewGazettePage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (error || !claims || typeof claims.sub !== "string") redirect("/connexion?message=connexion-requise&retour=%2Fadministration%2Fgazettes%2Fnouveau");
  if (getAppRole(claims.app_metadata) !== "admin") redirect("/compte");

  const errorMessage = query.erreur === "titre"
    ? "Le titre de une est obligatoire."
    : query.erreur === "couverture"
      ? "La couverture doit être un fichier JPG, PNG ou WebP de 4 Mo maximum."
      : query.erreur
        ? "La Gazette n’a pas pu être créée. Vérifiez notamment le numéro d’édition."
        : null;

  return (
    <main className="site-shell admin-page admin-gazettes-page">
      <SiteHeader />
      <section className="admin-hero"><div className="content-frame admin-hero__layout"><div><p className="eyebrow">CMS · Gazettes</p><h1>Nouveau numéro</h1><p>La Gazette sera créée en brouillon et restera invisible au public jusqu’à une publication explicite.</p></div><div className="admin-hero__side"><Link className="button button--ghost button--small" href="/administration/gazettes">← Retour</Link></div></div></section>

      <section className="content-frame admin-workspace">
        {errorMessage ? <div className="admin-alert" role="alert">{errorMessage}</div> : null}
        <section className="admin-panel admin-chronicle-editor-panel">
          <header className="admin-panel__head"><div><p className="eyebrow">Étape 1</p><h2>Identité du numéro</h2></div><span className="admin-panel__status">Brouillon</span></header>
          <form className="admin-chronicle-form" action={createGazette} encType="multipart/form-data">
            <label className="admin-chronicle-field"><span>Nom du journal</span><input name="title" maxLength={160} defaultValue="La Gazette d’Imetheran" /></label>
            <label className="admin-chronicle-field"><span>Numéro</span><input name="issue_number" type="number" min={0} max={9999} placeholder="automatique si vide" /></label>
            <label className="admin-chronicle-field admin-chronicle-field--wide"><span>Titre à la une *</span><input name="headline" maxLength={220} required placeholder="Ex. Une nuit mouvementée à Tuliyollal" /></label>
            <label className="admin-chronicle-field"><span>Slug</span><input name="slug" maxLength={110} placeholder="généré automatiquement si vide" /></label>
            <label className="admin-chronicle-field"><span>Édition / sous-titre</span><input name="edition" maxLength={180} placeholder="Édition de la semaine · Tural" /></label>
            <label className="admin-chronicle-field admin-chronicle-field--wide"><span>Résumé du numéro</span><textarea name="excerpt" rows={6} maxLength={8000} placeholder="Le texte de présentation visible dans la bibliothèque et sur l’accueil…" /></label>
            <label className="admin-chronicle-field admin-chronicle-field--wide"><span>Rubriques à mettre en avant</span><input name="highlights" placeholder="Vie communautaire, Rumeurs, Cuisine, Agenda" /><small>Séparez les rubriques par des virgules.</small></label>

            <div className="admin-gazette-cover-field">
              <div className="admin-gazette-cover-field__heading">
                <span>Image de couverture</span>
                <small>Stockée directement dans Imetheran.</small>
              </div>
              <div className="admin-gazette-cover-controls">
                <label>
                  <span>Importer une image</span>
                  <input name="cover_file" type="file" accept="image/jpeg,image/png,image/webp" />
                  <small>JPG, PNG ou WebP · 4 Mo maximum. L’image importée est prioritaire sur l’URL externe.</small>
                </label>
                <label>
                  <span>URL externe · facultatif</span>
                  <input name="cover_url" type="url" maxLength={1200} placeholder="https://…" />
                  <small>À utiliser seulement si vous préférez héberger l’image ailleurs.</small>
                </label>
              </div>
              <p>Utilisez uniquement une image que vous êtes autorisé à publier. Sans couverture, le visuel par défaut de la Gazette est conservé.</p>
            </div>

            <div className="admin-chronicle-form__actions"><button className="button button--primary" type="submit">Créer le brouillon</button><Link className="button button--ghost" href="/administration/gazettes">Annuler</Link></div>
          </form>
        </section>
      </section>
    </main>
  );
}
