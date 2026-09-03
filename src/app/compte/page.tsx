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

  const [
    { data: profile, error: profileError },
    { count: unreadCount },
    participation,
    { count: characterCount },
    { data: presentationBoard },
  ] = await Promise.all([
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
    supabase
      .from("characters")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId),
    supabase
      .from("forum_boards")
      .select("id")
      .eq("slug", "presentations")
      .eq("is_active", true)
      .maybeSingle(),
  ]);

  if (profileError || !profile) {
    redirect("/connexion?erreur=profil");
  }

  let hasPresentation = false;
  if (presentationBoard?.id) {
    const { count } = await supabase
      .from("forum_topics")
      .select("id", { count: "exact", head: true })
      .eq("board_id", presentationBoard.id)
      .eq("author_id", userId);
    hasPresentation = (count ?? 0) > 0;
  }

  const appMetadata = claims.app_metadata;
  const role =
    appMetadata && typeof appMetadata === "object" && "role" in appMetadata
      ? String(appMetadata.role)
      : "member";

  const roleLabel = role === "admin" ? "Administrateur" : role === "moderator" ? "Modérateur" : "Membre";
  const error = query.erreur ? errorMessages[query.erreur] ?? "Une erreur est survenue." : null;
  const profileReady = Boolean(profile.username && profile.bio.trim().length > 0);
  const onboardingSteps = [
    {
      label: "Profil communautaire",
      detail: profileReady ? "Votre identifiant et votre présentation sont renseignés." : "Ajoutez un identifiant et quelques mots de présentation.",
      done: profileReady,
      href: "#profil",
      action: "Compléter",
    },
    {
      label: "Charte et cadre RP",
      detail: "Consultez les repères communs quand vous en avez besoin ; cette étape n’est pas suivie comme une obligation.",
      done: null,
      href: "/guides/charte",
      action: "Consulter",
    },
    {
      label: "Présentation forum",
      detail: hasPresentation ? "Vous avez déjà ouvert un sujet de présentation." : "Présentez-vous quand vous vous sentez prêt à rejoindre les échanges.",
      done: hasPresentation,
      href: hasPresentation ? "/forum/presentations" : "/forum/presentations/nouveau",
      action: hasPresentation ? "Voir" : "Se présenter",
    },
    {
      label: "Premier personnage",
      detail: (characterCount ?? 0) > 0 ? `${characterCount} personnage${(characterCount ?? 0) > 1 ? "s" : ""} rattaché${(characterCount ?? 0) > 1 ? "s" : ""} à votre compte.` : "Créez une fiche lorsque vous souhaitez commencer à tisser vos accroches RP.",
      done: (characterCount ?? 0) > 0,
      href: (characterCount ?? 0) > 0 ? "/personnages" : "/personnages/nouveau",
      action: (characterCount ?? 0) > 0 ? "Voir" : "Créer",
    },
  ] as const;

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

        {participation.canParticipate ? (
          <section className="account-onboarding" aria-labelledby="account-onboarding-title">
            <header>
              <div>
                <p className="eyebrow">Parcours de bienvenue</p>
                <h2 id="account-onboarding-title">Prenez vos marques à votre rythme</h2>
              </div>
              <Link className="text-link" href="/guides/premiers-pas">Voir les premiers pas →</Link>
            </header>
            <div className="account-onboarding__steps">
              {onboardingSteps.map((step, index) => (
                <article className={step.done === true ? "is-done" : ""} key={step.label}>
                  <span className="account-onboarding__marker" aria-hidden="true">
                    {step.done === true ? "✓" : step.done === null ? "◇" : String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <strong>{step.label}</strong>
                    <p>{step.detail}</p>
                  </div>
                  <Link href={step.href}>{step.action} →</Link>
                </article>
              ))}
            </div>
            <small>Ce parcours est un repère, pas une liste d’obligations. Vous pouvez participer au forum sans avoir terminé chaque étape.</small>
          </section>
        ) : null}

        <div className="account-grid">
          <section className="account-card" id="profil">
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
              <div><dt>Personnages</dt><dd>{characterCount ?? 0}</dd></div>
              <div><dt>Notifications</dt><dd>{unreadCount ?? 0} non lue{(unreadCount ?? 0) > 1 ? "s" : ""}</dd></div>
              <div><dt>Inscription</dt><dd>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(profile.created_at))}</dd></div>
            </dl>
            <div className="account-next">
              <strong>{participation.canParticipate ? "Votre espace membre" : "Accès en lecture maintenu"}</strong>
              <p>{participation.canParticipate
                ? "Retrouvez ici les raccourcis vers vos principaux espaces et reprenez facilement votre parcours communautaire."
                : "Votre compte reste accessible pendant la suspension. La publication redeviendra disponible automatiquement à la fin de la mesure ou après réactivation par l’équipe."}</p>
            </div>
            <div className="account-card__links">
              {role === "admin" ? <Link className="text-link" href="/administration">Administration →</Link> : null}
              {role === "moderator" ? <Link className="text-link" href="/administration/forum">Modération du forum →</Link> : null}
              <Link className="text-link" href="/guides">Guides et charte →</Link>
              <Link className="text-link" href="/notifications">Notifications →</Link>
              <Link className="text-link" href="/personnages">Voir les personnages →</Link>
              <Link className="text-link" href="/forum">Aller au forum →</Link>
              <Link className="text-link" href="/compte/mot-de-passe">Changer mon mot de passe →</Link>
              <Link className="text-link" href="/confidentialite">Confidentialité et données →</Link>
              <Link className="text-link" href="/confidentialite/demande">Exercer mes droits →</Link>
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
