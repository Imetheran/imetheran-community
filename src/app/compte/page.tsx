import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "./actions";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  nom: "Le nom affiché est requis et ne peut pas dépasser 64 caractères.",
  identifiant: "L’identifiant doit contenir 3 à 32 caractères : lettres minuscules, chiffres, tiret ou underscore.",
  "identifiant-pris": "Cet identifiant est déjà utilisé par un autre membre.",
  bio: "La présentation est limitée à 1 200 caractères.",
  enregistrement: "Le profil n’a pas pu être enregistré. Réessayez dans un instant.",
};

export default async function ComptePage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; message?: string }>;
}) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const userId = claims?.sub;

  if (claimsError || typeof userId !== "string") {
    redirect("/connexion?message=connexion-requise");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name, username, bio, created_at")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    redirect("/connexion?erreur=profil");
  }

  const appMetadata = claims.app_metadata;
  const role =
    appMetadata && typeof appMetadata === "object" && "role" in appMetadata
      ? String(appMetadata.role)
      : "member";

  const roleLabel = role === "admin" ? "Administrateur" : role === "moderator" ? "Modérateur" : "Membre";
  const error = query.erreur ? errorMessages[query.erreur] ?? "Une erreur est survenue." : null;

  return (
    <main className="site-shell account-page">
      <SiteHeader />

      <section className="account-hero">
        <div className="content-frame account-hero__layout">
          <div>
            <p className="eyebrow">Espace membre</p>
            <h1>{profile.display_name}</h1>
            <p>Gérez votre identité communautaire avant de relier vos personnages, relations et activités du forum.</p>
          </div>
          <div className="account-hero__status">
            <span className="status-pill">{roleLabel}</span>
            <small>Compte Supabase actif</small>
          </div>
        </div>
      </section>

      <section className="content-frame account-workspace">
        {error ? <div className="auth-message auth-message--error">{error}</div> : null}
        {query.message === "enregistre" ? (
          <div className="auth-message auth-message--success">Votre profil a bien été mis à jour.</div>
        ) : null}

        <div className="account-grid">
          <section className="account-card">
            <p className="eyebrow">Profil</p>
            <h2>Identité communautaire</h2>
            <form className="auth-form" action={updateProfile}>
              <label>
                <span>Nom affiché</span>
                <input name="display_name" type="text" defaultValue={profile.display_name} maxLength={64} required />
              </label>
              <label>
                <span>Identifiant</span>
                <input name="username" type="text" defaultValue={profile.username ?? ""} minLength={3} maxLength={32} placeholder="ex. vekamel" />
                <small>Utilisé plus tard pour votre URL membre et les mentions.</small>
              </label>
              <label>
                <span>Présentation</span>
                <textarea name="bio" rows={7} defaultValue={profile.bio} maxLength={1200} placeholder="Quelques mots sur vous, votre façon de jouer ou vos envies sur Imetheran." />
              </label>
              <button className="button button--primary" type="submit">Enregistrer le profil</button>
            </form>
          </section>

          <aside className="account-card account-card--summary">
            <p className="eyebrow">Votre espace</p>
            <h2>Le socle est connecté</h2>
            <dl className="account-summary">
              <div><dt>Rôle</dt><dd>{roleLabel}</dd></div>
              <div><dt>Identifiant</dt><dd>{profile.username ? `@${profile.username}` : "À définir"}</dd></div>
              <div><dt>Inscription</dt><dd>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(profile.created_at))}</dd></div>
            </dl>
            <div className="account-next">
              <strong>Prochaine connexion</strong>
              <p>Les personnages, sujets suivis et notifications viendront se greffer ici au fur et à mesure du branchement du site.</p>
            </div>
            <div className="account-card__links">
              <Link className="text-link" href="/personnages">Voir les personnages →</Link>
              <Link className="text-link" href="/forum">Aller au forum →</Link>
            </div>
            <form action="/auth/signout" method="post">
              <button className="button button--ghost button--small" type="submit">Se déconnecter</button>
            </form>
          </aside>
        </div>
      </section>
    </main>
  );
}
