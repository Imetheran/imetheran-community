import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import { updatePassword } from "./actions";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  longueur: "Le nouveau mot de passe doit contenir au moins 10 caractères.",
  confirmation: "Les deux mots de passe ne correspondent pas.",
  enregistrement: "Le mot de passe n’a pas pu être modifié. Le lien de récupération a peut-être expiré : vous pouvez en demander un nouveau.",
};

export default async function PasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (claimsError || !claims || typeof claims.sub !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fcompte%2Fmot-de-passe");
  }

  const error = query.erreur ? errorMessages[query.erreur] ?? "Une erreur est survenue." : null;

  return (
    <main className="site-shell auth-page">
      <SiteHeader />

      <section className="auth-hero">
        <div className="content-frame auth-hero__content">
          <p className="eyebrow">Sécurité du compte</p>
          <h1>Nouveau mot de passe</h1>
          <p>Choisissez un nouveau mot de passe pour sécuriser votre accès à Imetheran.</p>
        </div>
      </section>

      <section className="content-frame auth-workspace">
        {error ? <div className="auth-message auth-message--error">{error}</div> : null}

        <div className="auth-grid auth-grid--single">
          <section className="auth-card" aria-labelledby="password-title">
            <p className="eyebrow">Compte membre</p>
            <h2 id="password-title">Modifier le mot de passe</h2>
            <p>
              Utilisez au minimum 10 caractères. Un mot de passe long et unique reste préférable à une variante d’un mot de passe déjà utilisé ailleurs.
            </p>
            <form className="auth-form" action={updatePassword}>
              <label>
                <span>Nouveau mot de passe</span>
                <input name="password" type="password" minLength={10} autoComplete="new-password" required />
                <small>10 caractères minimum.</small>
              </label>
              <label>
                <span>Confirmer le mot de passe</span>
                <input name="password_confirmation" type="password" minLength={10} autoComplete="new-password" required />
              </label>
              <button className="button button--primary" type="submit">Enregistrer le nouveau mot de passe</button>
            </form>
            <Link className="text-link auth-card__recovery" href="/compte">← Retour au compte</Link>
          </section>
        </div>
      </section>
    </main>
  );
}
