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

  return (
    <main className="site-shell admin-page admin-gazettes-page">
      <SiteHeader />
      <section className="admin-hero"><div className="content-frame admin-hero__layout"><div><p className="eyebrow">CMS · Gazettes</p><h1>Nouveau numéro</h1><p>La Gazette sera créée en brouillon et restera invisible au public jusqu’à une publication explicite.</p></div><div className="admin-hero__side"><Link className="button button--ghost button--small" href="/administration/gazettes">← Retour</Link></div></div></section>

      <section className="content-frame admin-workspace">
        {query.erreur ? <div className="admin-alert" role="alert">{query.erreur === "titre" ? "Le titre de une est obligatoire." : "La Gazette n’a pas pu être créée. Vérifiez notamment le numéro d’édition."}</div> : null}
        <section className="admin-panel admin-chronicle-editor-panel">
          <header className="admin-panel__head"><div><p className="eyebrow">Étape 1</p><h2>Identité du numéro</h2></div><span className="admin-panel__status">Brouillon</span></header>
          <form className="admin-chronicle-form" action={createGazette}>
            <label className="admin-chronicle-field"><span>Nom du journal</span><input name="title" maxLength={160} defaultValue="La Gazette d’Imetheran" /></label>
            <label className="admin-chronicle-field"><span>Numéro</span><input name="issue_number" type="number" min={0} max={9999} placeholder="automatique si vide" /></label>
            <label className="admin-chronicle-field admin-chronicle-field--wide"><span>Titre à la une *</span><input name="headline" maxLength={220} required placeholder="Ex. Une nuit mouvementée à Tuliyollal" /></label>
            <label className="admin-chronicle-field"><span>Slug</span><input name="slug" maxLength={110} placeholder="généré automatiquement si vide" /></label>
            <label className="admin-chronicle-field"><span>Édition / sous-titre</span><input name="edition" maxLength={180} placeholder="Édition de la semaine · Tural" /></label>
            <label className="admin-chronicle-field admin-chronicle-field--wide"><span>Résumé du numéro</span><textarea name="excerpt" rows={6} maxLength={8000} placeholder="Le texte de présentation visible dans la bibliothèque et sur l’accueil…" /></label>
            <label className="admin-chronicle-field admin-chronicle-field--wide"><span>Rubriques à mettre en avant</span><input name="highlights" placeholder="Vie communautaire, Rumeurs, Cuisine, Agenda" /><small>Séparez les rubriques par des virgules.</small></label>
            <label className="admin-chronicle-field admin-chronicle-field--wide"><span>Image de couverture officielle FFXIV</span><input name="cover_image" type="url" maxLength={1200} placeholder="https://lds-img.finalfantasyxiv.com/…" /><small>Utilisez uniquement une image officielle Final Fantasy XIV. Sans URL, le visuel du thème Imetheran est utilisé.</small></label>
            <div className="admin-chronicle-form__actions"><button className="button button--primary" type="submit">Créer le brouillon</button><Link className="button button--ghost" href="/administration/gazettes">Annuler</Link></div>
          </form>
        </section>
      </section>
    </main>
  );
}
