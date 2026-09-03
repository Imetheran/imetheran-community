import Link from "next/link";
import { redirect } from "next/navigation";
import { NotificationCountSync } from "@/components/notification-count-sync";
import { SiteHeader } from "@/components/site-header";
import { openNotification } from "@/app/notifications/actions";
import { signedCharacterPortraitMap } from "@/lib/character-portraits";
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

const notificationLabels: Record<string, string> = {
  forum_reply: "Forum",
  announcement: "Annonce",
  relationship_request: "Relation",
  relationship_approved: "Relation validée",
  relationship_rejected: "Relation refusée",
  relationship_revision: "Révision",
};

function formatSuspensionEnd(value: string | null) {
  if (!value) return "jusqu’à réactivation par l’équipe";
  return `jusqu’au ${new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(value))}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(value));
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("fr") ?? "")
    .join("") || "IM";
}

function characterStatusLabel(value: string) {
  if (value === "draft") return "Brouillon";
  if (value === "archived") return "Archivé";
  return "Publié";
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
    profileResult,
    unreadResult,
    participation,
    characterResult,
    presentationBoardResult,
    notificationResult,
    followResult,
    topicResult,
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
      .select("id, name, slug, portrait_path, status, visibility, updated_at", { count: "exact" })
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false })
      .limit(3),
    supabase
      .from("forum_boards")
      .select("id")
      .eq("slug", "presentations")
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("notifications")
      .select("id, type, title, body, href, read_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("forum_topic_follows")
      .select("topic_id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("forum_topics")
      .select("id, title, slug, board_id, status, last_activity_at")
      .eq("author_id", userId)
      .order("last_activity_at", { ascending: false })
      .limit(4),
  ]);

  const profile = profileResult.data;
  if (profileResult.error || !profile) {
    redirect("/connexion?erreur=profil");
  }

  const unreadCount = unreadResult.count ?? 0;
  const characterCount = characterResult.count ?? 0;
  const recentCharacters = characterResult.data ?? [];
  const recentNotifications = notificationResult.data ?? [];
  const followingCount = followResult.count ?? 0;
  const recentTopics = topicResult.data ?? [];

  let hasPresentation = false;
  if (presentationBoardResult.data?.id) {
    const { count } = await supabase
      .from("forum_topics")
      .select("id", { count: "exact", head: true })
      .eq("board_id", presentationBoardResult.data.id)
      .eq("author_id", userId);
    hasPresentation = (count ?? 0) > 0;
  }

  const boardIds = Array.from(new Set(recentTopics.map((topic) => topic.board_id)));
  const boardResult = boardIds.length > 0
    ? await supabase.from("forum_boards").select("id, slug, title").in("id", boardIds)
    : { data: [] as { id: string; slug: string; title: string }[] };
  const boardMap = new Map((boardResult.data ?? []).map((board) => [board.id, board]));
  const portraitMap = await signedCharacterPortraitMap(supabase, recentCharacters);

  const appMetadata = claims.app_metadata;
  const role =
    appMetadata && typeof appMetadata === "object" && "role" in appMetadata
      ? String(appMetadata.role)
      : "member";

  const roleLabel = role === "admin" ? "Administrateur" : role === "moderator" ? "Modérateur" : "Membre";
  const error = query.erreur ? errorMessages[query.erreur] ?? "Une erreur est survenue." : null;
  const bio = String(profile.bio ?? "");
  const profileReady = Boolean(profile.username && bio.trim().length > 0);
  const onboardingComplete = profileReady && hasPresentation && characterCount > 0;
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
      detail: characterCount > 0 ? `${characterCount} personnage${characterCount > 1 ? "s" : ""} rattaché${characterCount > 1 ? "s" : ""} à votre compte.` : "Créez une fiche lorsque vous souhaitez commencer à tisser vos accroches RP.",
      done: characterCount > 0,
      href: characterCount > 0 ? "/personnages" : "/personnages/nouveau",
      action: characterCount > 0 ? "Voir" : "Créer",
    },
  ] as const;

  return (
    <main className="site-shell account-page">
      <SiteHeader />
      <NotificationCountSync count={unreadCount} />

      <section className="account-hero account-hero--dashboard">
        <div className="content-frame account-hero__layout">
          <div>
            <p className="eyebrow">Espace membre</p>
            <h1>{profile.display_name}</h1>
            <p>Retrouvez ce qui demande votre attention, reprenez vos échanges et gérez votre identité communautaire.</p>
          </div>
          <div className="account-hero__status">
            <span className="status-pill">{roleLabel}</span>
            <small>{participation.canParticipate ? "Participation active" : "Participation suspendue"}</small>
          </div>
        </div>
      </section>

      <section className="content-frame account-workspace account-workspace--dashboard">
        {error ? <div className="auth-message auth-message--error">{error}</div> : null}
        {query.message === "enregistre" ? <div className="auth-message auth-message--success">Votre profil a bien été mis à jour.</div> : null}
        {query.message === "mot-de-passe" ? <div className="auth-message auth-message--success">Votre mot de passe a bien été modifié.</div> : null}
        {!participation.canParticipate ? (
          <div className="auth-message auth-message--error" role="status">
            <strong>Votre participation communautaire est suspendue {formatSuspensionEnd(participation.suspendedUntil)}.</strong>
            {participation.suspensionReason ? <> Motif : {participation.suspensionReason}</> : null}
            <> Vous pouvez toujours vous connecter, lire le site, consulter vos contenus et effectuer un signalement, mais les créations et modifications communautaires sont temporairement bloquées.</>
          </div>
        ) : null}

        <section className="account-dashboard" aria-labelledby="account-dashboard-title">
          <header className="account-dashboard__heading">
            <div>
              <p className="eyebrow">Aujourd’hui</p>
              <h2 id="account-dashboard-title">Votre tableau de bord</h2>
            </div>
            <Link className="text-link" href="/forum">Aller au forum →</Link>
          </header>

          <div className="account-dashboard__stats">
            <Link className={unreadCount > 0 ? "is-attention" : ""} href={unreadCount > 0 ? "/notifications?filtre=non-lues" : "/notifications"}>
              <small>Notifications</small>
              <strong>{unreadCount}</strong>
              <span>{unreadCount > 0 ? "À consulter" : "Tout est à jour"}</span>
            </Link>
            <Link href="/personnages">
              <small>Personnages</small>
              <strong>{characterCount}</strong>
              <span>{characterCount > 0 ? "Vos fiches RP" : "Créer une première fiche"}</span>
            </Link>
            <Link href="/forum">
              <small>Sujets suivis</small>
              <strong>{followingCount}</strong>
              <span>{followingCount > 0 ? "Activité à retrouver au forum" : "Suivez les échanges importants"}</span>
            </Link>
            <Link href={hasPresentation ? "/forum/presentations" : "/forum/presentations/nouveau"}>
              <small>Présentation</small>
              <strong>{hasPresentation ? "✓" : "—"}</strong>
              <span>{hasPresentation ? "Sujet créé" : "À votre rythme"}</span>
            </Link>
          </div>

          <div className="account-dashboard__panels">
            <section className="account-dashboard-panel">
              <header>
                <div><p className="eyebrow">À lire</p><h3>Notifications récentes</h3></div>
                <Link href="/notifications">Tout voir →</Link>
              </header>
              {recentNotifications.length > 0 ? (
                <div className="account-feed">
                  {recentNotifications.map((notification) => (
                    <article className={!notification.read_at ? "is-unread" : ""} key={notification.id}>
                      <div>
                        <small>{notificationLabels[notification.type] ?? "Imetheran"} · {formatDate(notification.created_at)}</small>
                        <strong>{notification.title}</strong>
                        <p>{notification.body}</p>
                      </div>
                      <form action={openNotification}>
                        <input type="hidden" name="notification_id" value={notification.id} />
                        <button type="submit" aria-label={`Ouvrir : ${notification.title}`}>→</button>
                      </form>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="account-dashboard-panel__empty">Aucune notification récente. Votre fil est calme.</div>
              )}
            </section>

            <section className="account-dashboard-panel">
              <header>
                <div><p className="eyebrow">Rôleplay</p><h3>Mes personnages</h3></div>
                <Link href={characterCount > 0 ? "/personnages" : "/personnages/nouveau"}>{characterCount > 0 ? "Tout voir" : "Créer"} →</Link>
              </header>
              {recentCharacters.length > 0 ? (
                <div className="account-characters">
                  {recentCharacters.map((character) => {
                    const portraitUrl = portraitMap.get(character.id);
                    return (
                      <Link href={`/personnages/${character.slug}`} key={character.id}>
                        <span className="account-character__portrait" aria-hidden="true">
                          {portraitUrl ? <img src={portraitUrl} alt="" /> : initials(character.name)}
                        </span>
                        <span>
                          <strong>{character.name}</strong>
                          <small>{characterStatusLabel(character.status)} · modifié {formatDate(character.updated_at)}</small>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="account-dashboard-panel__empty">Aucun personnage pour le moment. Une fiche suffit pour commencer à incarner vos scènes RP.</div>
              )}
            </section>

            <section className="account-dashboard-panel">
              <header>
                <div><p className="eyebrow">Forum</p><h3>Mes sujets récents</h3></div>
                <Link href="/forum">Forum →</Link>
              </header>
              {recentTopics.length > 0 ? (
                <div className="account-topics">
                  {recentTopics.map((topic) => {
                    const board = boardMap.get(topic.board_id);
                    if (!board) return null;
                    return (
                      <Link href={`/forum/${board.slug}/sujet/${topic.slug}`} key={topic.id}>
                        <small>{board.title} · {topic.status === "open" ? "En cours" : topic.status === "finished" ? "Terminé" : "Archivé"}</small>
                        <strong>{topic.title}</strong>
                        <span>Dernière activité {formatDate(topic.last_activity_at)}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="account-dashboard-panel__empty">Vous n’avez encore ouvert aucun sujet. Le forum est prêt quand vous l’êtes.</div>
              )}
            </section>
          </div>
        </section>

        {participation.canParticipate && !onboardingComplete ? (
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
        ) : participation.canParticipate ? (
          <section className="account-onboarding-complete">
            <span aria-hidden="true">✓</span>
            <div><strong>Vos repères essentiels sont en place.</strong><p>La charte et les premiers pas restent disponibles à tout moment dans les guides.</p></div>
            <Link className="text-link" href="/guides">Guides →</Link>
          </section>
        ) : null}

        <div className="account-settings-grid">
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
                <textarea name="bio" rows={7} defaultValue={bio} maxLength={1200} placeholder="Quelques mots sur vous, votre façon de jouer ou vos envies sur Imetheran." />
              </label>
              <button className="button button--primary" type="submit">Enregistrer le profil</button>
            </form>
          </section>

          <aside className="account-card account-card--summary">
            <p className="eyebrow">Compte et accès</p>
            <h2>Réglages utiles</h2>
            <dl className="account-summary account-summary--compact">
              <div><dt>Rôle</dt><dd>{roleLabel}</dd></div>
              <div><dt>Participation</dt><dd>{participation.canParticipate ? "Active" : "Suspendue"}</dd></div>
              <div><dt>Identifiant</dt><dd>{profile.username ? `@${profile.username}` : "À définir"}</dd></div>
              <div><dt>Inscription</dt><dd>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(profile.created_at))}</dd></div>
            </dl>

            <div className="account-link-groups">
              <section>
                <strong>Communauté</strong>
                <Link href="/notifications">Notifications</Link>
                <Link href="/personnages">Personnages</Link>
                <Link href="/liens">Relations RP</Link>
                <Link href="/guides">Guides et charte</Link>
              </section>
              <section>
                <strong>Compte</strong>
                <Link href="/compte/mot-de-passe">Changer mon mot de passe</Link>
                <Link href="/confidentialite">Confidentialité et données</Link>
                <Link href="/confidentialite/demande">Exercer mes droits</Link>
              </section>
              {role === "admin" || role === "moderator" ? (
                <section>
                  <strong>Équipe</strong>
                  {role === "admin" ? <Link href="/administration">Administration</Link> : null}
                  {role === "moderator" ? <Link href="/administration/forum">Modération du forum</Link> : null}
                </section>
              ) : null}
            </div>

            <form className="account-signout" action="/auth/signout" method="post">
              <button className="button button--ghost button--small" type="submit">Se déconnecter</button>
            </form>
          </aside>
        </div>
      </section>
    </main>
  );
}
