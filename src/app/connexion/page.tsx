import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { login, signup } from "./actions";

const errorMessages: Record<string, string> = {
  champs: "Merci de remplir tous les champs requis.",
  identifiants: "Adresse e-mail ou mot de passe incorrect.",
  pseudo: "Le nom affiché ne peut pas dépasser 64 caractères.",
  "mot-de-passe": "Le mot de passe doit contenir au moins 10 caractères.",
  inscription: "L’inscription n’a pas pu être finalisée. Vérifiez l’adresse utilisée ou réessayez plus tard.",
  confirmation: "Le lien de confirmation est invalide ou a expiré. Vous pouvez recommencer la connexion ou l’inscription.",
  profil: "Votre session est valide, mais votre profil membre n’a pas pu être chargé.",
};

const statusMessages: Record<string, string> = {
  confirmation: "Votre compte est créé. Consultez votre boîte mail pour confirmer votre adresse avant la première connexion.",
  "connexion-requise": "Connectez-vous pour accéder à cet espace réservé aux membres.",
  deconnexion: "Vous êtes maintenant déconnecté d’Imetheran.",
};

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

  return (
    <main className="site-shell auth-page">
      <SiteHeader />

      <section className="auth-hero">
        <div className="content-frame auth-hero__content">
          <p className="eyebrow">Espace membre</p>
          <h1>Rejoindre Imetheran</h1>
          <p>
            Un seul compte pour participer au forum, créer vos personnages, suivre vos scènes et gérer vos contenus communautaires.
          </p>
        </div>
      </section>

      <section className="content-frame auth-workspace">
        {error ? <div className="auth-message auth-message--error">{error}</div> : null}
        {status ? <div className="auth-message auth-message--success">{status}</div> : null}

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
              <button className="button button--primary" type="submit">Se connecter</button>
            </form>
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
              <button className="button button--primary" type="submit">Créer mon compte</button>
            </form>
          </section>
        </div>

        <footer className="auth-workspace__footer">
          <Link className="text-link" href={forumReturn}>← Retour au forum</Link>
          <span>Authentification sécurisée par Supabase.</span>
        </footer>
      </section>
    </main>
  );
}
