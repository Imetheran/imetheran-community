import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getMemberParticipation } from "@/lib/member-participation";
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

function formatSuspensionEnd(value: string | null) {
  if (!value) return "jusqu’à réactivation par l’équipe";
  return `jusqu’au ${new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(value))}`;
}

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

  if (claimsError || !claims || typeof userId !== "string") {
    redirect("/connexion?message=connexion-requise");
  }

  const [{ data: profile, error: profileError }, { count: unreadCount }, participation] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, username, bio, created_at")
      .eq("id", userId)
      .single(),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null),
    getMemberParticipation(supabase, userId),
  ]);

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
            <p>Gérez votre identité communautaire, vos personnages, relations et activités du forum.</p>
          </div>
          <div className="account-hero__status">
            <span className="status-pill">{roleLabel}</span>
            <small>{participation.canParticipate ? "Participation active" : "Participation suspendue"}</small>
          </div>
        </div>
      </section>

      <section className="content-frame account-workspace">
        {error ? <div className="auth-message auth-message--error">{error}</div> : null}
        {query.message === "enregistre" ? (
          <div className="auth-message auth-message--success">Votre profil a bien été mis à jour.</div>
        ) : null}
        {query.message === "mot-de-passe" ? (
          <div className="auth-message auth-message--success">Votre mot de passe a bien été modifié.</div>
        ) : null}
        {!participation.canParticipate ? (
          <div className="auth-message auth-message--error" role="status">
            <strong>Votre participation communautaire est suspendue {formatSuspensionEnd(participation.suspendedUntil)}.</strong>
            {participation.suspensionReason ? <> Motif : {participation.suspensionReason}</> : null}
            <> Vous pouvez toujours vous connecter, lire le site, consulter vos contenus et effectuer un signalement, mais les créations et modifications communautaires sont temporairement bloquées.</>
          </div>
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
            <h2>Votre compte Imetheran</h2>
            <dl className="account-summary">
              <div><dt>Rôle</dt><dd>{roleLabel}</dd></div>
              <div><dt>Participation</dt><dd>{participation.canParticipate ? "Active" : "Suspendue"}</dd></div>
              <div><dt>Identifiant</dt><dd>{profile.username ? `@${profile.username}` : "À définir"}</dd></div>
              <div><dt>Notifications</dt><dd>{unreadCount ?? 0} non lue{(unreadCount ?? 0) > 1 ? "s" : ""}</dd></div>
              <div><dt>Inscription</dt><dd>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(profile.created_at))}</dd></div>
            </dl>
            <div className="account-next">
              <strong>{participation.canParticipate ? "Votre espace membre" : "Accès en lecture maintenu"}</strong>
              <p>{participation.canParticipate
                ? "Forum, personnages, relations et notifications utilisent vos données réelles et les permissions de votre compte."
                : "Votre compte reste accessible pendant la suspension. La publication redeviendra disponible automatiquement à la fin de la mesure ou après réactivation par l’équipe."}</p>
            </div>
            <div className="account-card__links">
              {role === "admin" ? <Link className="text-link" href="/administration">Administration →</Link> : null}
              {role === "moderator" ? <Link className="text-link" href="/administration/forum">Modération du forum →</Link> : null}
              <Link className="text-link" href="/notifications">Notifications →</Link>
              <Link className="text-link" href="/personnages">Voir les personnages →</Link>
              <Link className="text-link" href="/forum">Aller au forum →</Link>
              <Link className="text-link" href="/compte/mot-de-passe">Changer mon mot de passe →</Link>
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
