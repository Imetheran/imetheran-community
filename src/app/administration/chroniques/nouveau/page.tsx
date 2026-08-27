import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import { getAppRole } from "@/lib/chronicles";
import { createChronicle } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewChroniclePage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (error || !claims || typeof claims.sub !== "string") redirect("/connexion?message=connexion-requise&retour=%2Fadministration%2Fchroniques%2Fnouveau");
  if (getAppRole(claims.app_metadata) !== "admin") redirect("/compte");

  return (
    <main className="site-shell admin-page admin-chronicles-page">
      <SiteHeader />
      <section className="admin-hero"><div className="content-frame admin-hero__layout"><div><p className="eyebrow">CMS · Chroniques</p><h1>Nouveau dossier</h1><p>Le dossier sera créé en brouillon. Rien ne sera visible publiquement avant une action de publication explicite.</p></div><div className="admin-hero__side"><Link className="button button--ghost button--small" href="/administration/chroniques">← Retour</Link></div></div></section>

      <section className="content-frame admin-workspace">
        {query.erreur ? <div className="admin-alert" role="alert">{query.erreur === "titre" ? "Le titre est obligatoire." : "La chronique n’a pas pu être créée."}</div> : null}
        <section className="admin-panel admin-chronicle-editor-panel">
          <header className="admin-panel__head"><div><p className="eyebrow">Étape 1</p><h2>Identité de la chronique</h2></div><span className="admin-panel__status">Brouillon</span></header>
          <form className="admin-chronicle-form" action={createChronicle}>
            <label className="admin-chronicle-field admin-chronicle-field--wide"><span>Titre *</span><input name="title" maxLength={160} required placeholder="Ex. Les Échos de la Veille" /></label>
            <label className="admin-chronicle-field"><span>Slug</span><input name="slug" maxLength={110} placeholder="laissé vide = généré automatiquement" /></label>
            <label className="admin-chronicle-field"><span>Statut narratif</span><select name="narrative_status" defaultValue="upcoming"><option value="upcoming">À venir</option><option value="open">Ouverte</option><option value="closed">Terminée</option></select></label>
            <label className="admin-chronicle-field admin-chronicle-field--wide"><span>Sous-titre</span><input name="subtitle" maxLength={240} placeholder="Campagne communautaire · Saison I" /></label>
            <label className="admin-chronicle-field admin-chronicle-field--wide"><span>Synopsis</span><textarea name="synopsis" rows={7} maxLength={8000} placeholder="Le résumé public du scénario…" /></label>
            <label className="admin-chronicle-field admin-chronicle-field--wide"><span>Intention / accroche</span><textarea name="hook" rows={4} maxLength={5000} placeholder="Ce que cette chronique propose aux joueurs…" /></label>
            <label className="admin-chronicle-field"><span>Date de début</span><input name="started_at" type="date" /></label>
            <label className="admin-chronicle-field"><span>Lieu</span><input name="location" maxLength={200} /></label>
            <label className="admin-chronicle-field"><span>Organisation</span><input name="organizer" maxLength={160} defaultValue="Équipe RP d’Imetheran" /></label>
            <label className="admin-chronicle-field"><span>Tags</span><input name="tags" placeholder="Enquête, Exploration, Mystère" /></label>
            <label className="admin-chronicle-field admin-chronicle-field--wide"><span>Image de couverture officielle FFXIV</span><input name="cover_image" type="url" maxLength={1200} placeholder="https://lds-img.finalfantasyxiv.com/…" /><small>Utilisez uniquement une image officielle Final Fantasy XIV. Sans URL, le visuel de thème d’Imetheran sera utilisé.</small></label>
            <div className="admin-chronicle-form__actions"><button className="button button--primary" type="submit">Créer le brouillon</button><Link className="button button--ghost" href="/administration/chroniques">Annuler</Link></div>
          </form>
        </section>
      </section>
    </main>
  );
}
