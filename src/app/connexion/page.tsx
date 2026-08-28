import Link from "next/link";
import Script from "next/script";
import { SiteHeader } from "@/components/site-header";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { login, requestPasswordReset, signup } from "./actions";

const errorMessages: Record<string, string> = {
  champs: "Merci de remplir tous les champs requis.",
  identifiants: "Adresse e-mail ou mot de passe incorrect.",
  pseudo: "Le nom affiché ne peut pas dépasser 64 caractères.",
  "mot-de-passe": "Le mot de passe doit contenir au moins 10 caractères.",
  inscription: "L’inscription n’a pas pu être finalisée. Vérifiez l’adresse utilisée ou réessayez plus tard.",
  confirmation: "Le lien de confirmation est invalide ou a expiré. Vous pouvez recommencer la connexion ou l’inscription.",
  profil: "Votre session est valide, mais votre profil membre n’a pas pu être chargé.",
  recuperation: "L’e-mail de récupération n’a pas pu être envoyé. Réessayez dans quelques instants.",
  captcha: "La vérification anti-robot n’a pas pu être validée. Recommencez le contrôle puis réessayez.",
  limite: "Trop de tentatives ont été effectuées en peu de temps. Patientez quelques instants avant de réessayer.",
};

const statusMessages: Record<string, string> = {
  confirmation: "Votre compte est créé. Consultez votre boîte mail pour confirmer votre adresse avant la première connexion.",
  "connexion-requise": "Connectez-vous pour accéder à cet espace réservé aux membres.",
  deconnexion: "Vous êtes maintenant déconnecté d’Imetheran.",
  recuperation: "Si un compte correspond à cette adresse, un e-mail de récupération vient d’être envoyé.",
};

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();

function safeReturnTo(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\0")) return "/compte";
  return value;
}

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; message?: string; mode?: string; retour?: string }>;
}) {
  const query = await searchParams;
  const error = query.erreur ? errorMessages[query.erreur] ?? "Une erreur est survenue." : null;
  const status = query.message ? statusMessages[query.message] : null;
  const returnTo = safeReturnTo(query.retour);
  const forumReturn = returnTo.startsWith("/forum") ? returnTo.split("#")[0] : "/forum";
  const recoveryMode = query.mode === "recuperation";

  return (
    <main className="site-shell auth-page">
      {turnstileSiteKey ? (
        <Script
          id="cloudflare-turnstile"
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
        />
      ) : null}

      <SiteHeader />

      <section className="auth-hero">
        <div className="content-frame auth-hero__content">
          <p className="eyebrow">Espace membre</p>
          <h1>{recoveryMode ? "Retrouver votre compte" : "Rejoindre Imetheran"}</h1>
          <p>
            {recoveryMode
              ? "Demandez un lien sécurisé pour choisir un nouveau mot de passe et reprendre l’accès à votre espace membre."
              : "Un seul compte pour participer au forum, créer vos personnages, suivre vos scènes et gérer vos contenus communautaires."}
          </p>
        </div>
      </section>

      <section className="content-frame auth-workspace">
        {error ? <div className="auth-message auth-message--error" role="alert">{error}</div> : null}
        {status ? <div className="auth-message auth-message--success" role="status" aria-live="polite">{status}</div> : null}

        {recoveryMode ? (
          <div className="auth-grid auth-grid--single">
            <section className="auth-card" aria-labelledby="recovery-title">
              <p className="eyebrow">Récupération</p>
              <h2 id="recovery-title">Mot de passe oublié</h2>
              <p>
                Indiquez l’adresse e-mail de votre compte. Pour préserver la confidentialité des membres, le message de confirmation reste identique qu’un compte existe ou non.
              </p>
              <form className="auth-form" action={requestPasswordReset}>
                <label>
                  <span>Adresse e-mail</span>
                  <input name="email" type="email" autoComplete="email" required />
                </label>
                <TurnstileWidget siteKey={turnstileSiteKey} action="recovery" />
                <button className="button button--primary" type="submit">Envoyer le lien de récupération</button>
              </form>
              <Link className="text-link auth-card__recovery" href="/connexion">← Retour à la connexion</Link>
            </section>
          </div>
        ) : (
          <div className="auth-grid">
            <section className="auth-card" aria-labelledby="login-title">
              <p className="eyebrow">Déjà membre</p>
              <h2 id="login-title">Connexion</h2>
              <p>Retrouvez votre compte, vos personnages et les espaces réservés aux membres.</p>
              <form className="auth-form" action={login}>
                <input type="hidden" name="return_to" value={returnTo} />
                <label>
                  <span>Adresse e-mail</span>
                  <input name="email" type="email" autoComplete="email" required />
                </label>
                <label>
                  <span>Mot de passe</span>
                  <input name="password" type="password" autoComplete="current-password" required />
                </label>
                <TurnstileWidget siteKey={turnstileSiteKey} action="login" />
                <button className="button button--primary" type="submit">Se connecter</button>
              </form>
              <Link className="text-link auth-card__recovery" href="/connexion?mode=recuperation">Mot de passe oublié ?</Link>
            </section>

            <section className="auth-card auth-card--signup" aria-labelledby="signup-title">
              <p className="eyebrow">Première visite</p>
              <h2 id="signup-title">Créer un compte</h2>
              <p>L’inscription ouvre l’accès aux espaces membres. Votre adresse devra être confirmée par e-mail.</p>
              <form className="auth-form" action={signup}>
                <input type="hidden" name="return_to" value={returnTo} />
                <label>
                  <span>Nom affiché</span>
                  <input name="display_name" type="text" maxLength={64} autoComplete="nickname" required />
                </label>
                <label>
                  <span>Adresse e-mail</span>
                  <input name="email" type="email" autoComplete="email" required />
                </label>
                <label>
                  <span>Mot de passe</span>
                  <input name="password" type="password" minLength={10} autoComplete="new-password" required />
                  <small>10 caractères minimum.</small>
                </label>
                <TurnstileWidget siteKey={turnstileSiteKey} action="signup" />
                <button className="button button--primary" type="submit">Créer mon compte</button>
              </form>
              <p className="auth-charter-note">
                Avant de rejoindre la communauté, prenez connaissance de la <Link href="/guides/charte">charte d’Imetheran</Link> et du <Link href="/guides/roleplay">cadre rôleplay</Link>.
              </p>
            </section>
          </div>
        )}

        <footer className="auth-workspace__footer">
          <Link className="text-link" href={forumReturn}>← Retour au forum</Link>
          <Link className="text-link" href="/guides/premiers-pas">Découvrir les premiers pas →</Link>
        </footer>
      </section>
    </main>
  );
}
