import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal-page-shell";
import { createClient } from "@/lib/supabase/server";
import { submitPrivacyRequest } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Exercer mes droits",
  description: "Formulaire de demande relatif aux données personnelles sur Imetheran.",
  robots: { index: false, follow: false },
};

const errorMessages: Record<string, string> = {
  email: "Indiquez une adresse e-mail valide afin que la demande puisse être rattachée et suivie.",
  type: "Choisissez un type de demande valide.",
  message: "Votre message doit contenir entre 10 et 4 000 caractères.",
  limite: "Plusieurs demandes ont déjà été envoyées récemment avec cette adresse. Réessayez dans un moment.",
  envoi: "La demande n’a pas pu être enregistrée. Réessayez dans quelques instants.",
};

export default async function PrivacyRequestPage({ searchParams }: { searchParams: Promise<{ message?: string; erreur?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claimEmail = claimsData?.claims && typeof claimsData.claims.email === "string" ? claimsData.claims.email : "";
  const sent = params.message === "envoyee";
  const errorMessage = params.erreur ? errorMessages[params.erreur] : null;

  return (
    <LegalPageShell
      eyebrow="Vos droits"
      title="Demande relative à vos données"
      intro="Utilisez ce formulaire pour demander l’accès, la rectification, la suppression ou toute autre action concernant vos données personnelles sur Imetheran."
    >
      <section className="legal-section">
        <h2>Avant d’envoyer</h2>
        <p>Décrivez suffisamment votre demande pour que l’administration puisse identifier les données concernées. Ne transmettez jamais votre mot de passe, un code de récupération ou une clé de sécurité.</p>
        <p>Si vous êtes connecté, l’adresse e-mail de votre compte est préremplie. Si vous n’avez plus accès à votre compte, utilisez l’adresse qui était associée à celui-ci lorsque c’est possible.</p>
        <div className="legal-callout"><p>Pour protéger les comptes, une vérification raisonnable de l’identité peut être demandée avant une communication ou une suppression de données.</p></div>
      </section>

      <section className="legal-section">
        <h2>Formulaire</h2>
        {sent ? <div className="auth-message auth-message--success" role="status"><strong>Demande enregistrée.</strong> L’administration pourra la consulter dans le registre interne et la traiter.</div> : null}
        {errorMessage ? <div className="auth-message auth-message--error" role="alert">{errorMessage}</div> : null}
        <form className="legal-form" action={submitPrivacyRequest}>
          <label className="legal-honeypot" aria-hidden="true">Site web<input name="website" tabIndex={-1} autoComplete="off" /></label>
          <label>
            Adresse e-mail
            <input type="email" name="email" defaultValue={claimEmail} autoComplete="email" required maxLength={254} />
          </label>
          <label>
            Nature de la demande
            <select name="request_type" defaultValue="access" required>
              <option value="access">Accès à mes données</option>
              <option value="rectification">Rectification</option>
              <option value="deletion">Suppression / effacement</option>
              <option value="objection">Opposition</option>
              <option value="restriction">Limitation du traitement</option>
              <option value="portability">Portabilité</option>
              <option value="other">Autre demande</option>
            </select>
          </label>
          <label>
            Votre demande
            <textarea name="message" required minLength={10} maxLength={4000} placeholder="Expliquez ce que vous souhaitez obtenir ou faire corriger…" />
          </label>
          <p className="legal-form__hint">Les informations de ce formulaire sont utilisées uniquement pour traiter et documenter votre demande relative aux données personnelles.</p>
          <div className="legal-actions"><button className="button button--primary" type="submit">Envoyer la demande</button><Link className="button button--ghost" href="/confidentialite">Retour à la politique</Link></div>
        </form>
      </section>
    </LegalPageShell>
  );
}
