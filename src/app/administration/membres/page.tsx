import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import { ConfirmDeleteButton } from "../confirm-delete-button";
import destructiveStyles from "../destructive-actions.module.css";
import { changeMemberRole, reactivateMember, suspendMember } from "./actions";
import { deleteMember } from "./delete-action";

export const dynamic = "force-dynamic";

type MemberRole = "member" | "moderator" | "admin";
type ParticipationStatus = "active" | "suspended";

type AdminMember = {
  user_id: string;
  display_name: string;
  username: string | null;
  email: string | null;
  email_confirmed: boolean;
  member_role: MemberRole;
  participation_status: ParticipationStatus;
  suspended_until: string | null;
  suspension_reason: string | null;
  created_at: string;
  last_sign_in_at: string | null;
};

type ModerationEvent = {
  id: number;
  target_user_id: string;
  actor_user_id: string | null;
  event_type: "role_changed" | "participation_suspended" | "participation_reactivated";
  details: Record<string, unknown> | null;
  created_at: string;
};

type Search = {
  message?: string;
  erreur?: string;
  q?: string;
  role?: string;
  statut?: string;
};

const successMessages: Record<string, string> = {
  role: "Le rôle du membre a été mis à jour. Le nouveau rôle sera pleinement visible après renouvellement de sa session.",
  suspendu: "La participation du membre est suspendue. Il peut toujours se connecter et lire, mais ne peut plus publier.",
  reactive: "La participation du membre est de nouveau active.",
  supprime: "Le membre a été supprimé définitivement. Ses anciens sujets et messages restent visibles sous l’identité « Compte supprimé ».",
  "supprime-stockage": "Le compte et ses données ont été supprimés, mais au moins un fichier stocké n’a pas pu être nettoyé automatiquement.",
};

const errorMessages: Record<string, string> = {
  donnees: "Les données envoyées sont invalides.",
  suspension: "Indiquez un motif de suspension entre 3 et 500 caractères.",
  "dernier-admin": "Impossible de retirer le rôle du dernier administrateur.",
  "auto-suspension": "Un administrateur ne peut pas suspendre sa propre participation.",
  "auto-suppression-compte": "Vous ne pouvez pas supprimer votre propre compte depuis l’administration.",
  "dernier-admin-suppression": "Impossible de supprimer le dernier compte administrateur.",
  "membre-introuvable": "Ce membre n’existe plus.",
  droits: "Votre session n’a plus les droits administrateur. Reconnectez-vous.",
  enregistrement: "L’opération n’a pas pu être enregistrée. Réessayez dans un instant.",
  suppression: "Le membre n’a pas pu être supprimé. Aucune donnée n’a été effacée.",
};

function getRole(appMetadata: unknown) {
  if (!appMetadata || typeof appMetadata !== "object" || !("role" in appMetadata)) return "member";
  return String((appMetadata as { role?: unknown }).role ?? "member");
}

function roleLabel(role: MemberRole) {
  if (role === "admin") return "Administrateur";
  if (role === "moderator") return "Modérateur";
  return "Membre";
}

function formatDate(value: string | null, withTime = false) {
  if (!value) return "Jamais";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" as const } : {}),
    timeZone: "Europe/Paris",
  }).format(new Date(value));
}

function isEffectiveSuspension(member: AdminMember) {
  return member.participation_status === "suspended" &&
    (!member.suspended_until || new Date(member.suspended_until).getTime() > Date.now());
}

function eventLabel(event: ModerationEvent) {
  if (event.event_type === "participation_suspended") return "Participation suspendue";
  if (event.event_type === "participation_reactivated") return "Participation réactivée";
  const from = typeof event.details?.from === "string" ? event.details.from : null;
  const to = typeof event.details?.to === "string" ? event.details.to : null;
  if (from && to) return `Rôle : ${from} → ${to}`;
  return "Rôle modifié";
}

export default async function AdministrationMembersPage({ searchParams }: { searchParams: Promise<Search> }) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (claimsError || !claims || typeof claims.sub !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fadministration%2Fmembres");
  }

  if (getRole(claims.app_metadata) !== "admin") redirect("/compte");

  const [membersResult, eventsResult] = await Promise.all([
    supabase.rpc("admin_list_members"),
    supabase
      .from("member_moderation_events")
      .select("id, target_user_id, actor_user_id, event_type, details, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const members = (membersResult.data ?? []) as AdminMember[];
  const events = (eventsResult.data ?? []) as ModerationEvent[];
  const memberMap = new Map(members.map((member) => [member.user_id, member]));
  const adminCount = members.filter((member) => member.member_role === "admin").length;
  const moderatorCount = members.filter((member) => member.member_role === "moderator").length;
  const suspendedCount = members.filter(isEffectiveSuspension).length;
  const loadError = membersResult.error || eventsResult.error;
  const success = query.message ? successMessages[query.message] : null;
  const error = query.erreur ? errorMessages[query.erreur] ?? "Une erreur est survenue." : null;
  const search = String(query.q ?? "").trim().slice(0, 120);
  const roleFilter = String(query.role ?? "").trim();
  const statusFilter = String(query.statut ?? "").trim();
  const needle = search.toLocaleLowerCase("fr");
  const filteredMembers = members.filter((member) => {
    const effectiveSuspended = isEffectiveSuspension(member);
    const matchesSearch = !needle || `${member.display_name} ${member.username ?? ""} ${member.email ?? ""}`.toLocaleLowerCase("fr").includes(needle);
    const matchesRole = !roleFilter || member.member_role === roleFilter;
    const matchesStatus = !statusFilter || (statusFilter === "suspended" ? effectiveSuspended : !effectiveSuspended);
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <main className="site-shell admin-page admin-members-page">
      <SiteHeader />

      <section className="admin-hero admin-members-hero">
        <div className="content-frame admin-hero__layout">
          <div>
            <p className="eyebrow">Administration · Communauté</p>
            <h1>Gestion des membres</h1>
            <p>
              Rôles, état de participation, recherche rapide et historique de modération. Une suspension bloque les publications
              communautaires sans empêcher la connexion ni la lecture du site.
            </p>
          </div>
          <div className="admin-hero__side">
            <span className="admin-role-badge"><span aria-hidden="true">✦</span> Accès administrateur</span>
            <Link className="button button--ghost button--small" href="/administration">← Tableau de bord</Link>
          </div>
        </div>
      </section>

      <section className="content-frame admin-workspace admin-members-workspace">
        {success ? <div className="admin-members-message admin-members-message--success" role="status">{success}</div> : null}
        {error ? <div className="admin-members-message admin-members-message--error" role="alert">{error}</div> : null}
        {loadError ? (
          <div className="admin-alert" role="alert">
            <strong>Le registre membres n’a pas pu être chargé complètement.</strong>
            <span>{loadError.message}</span>
          </div>
        ) : null}

        <div className="admin-members-metrics" aria-label="Résumé des membres">
          <div><span>01</span><strong>{members.length}</strong><small>Membres</small></div>
          <div><span>02</span><strong>{adminCount}</strong><small>Administrateurs</small></div>
          <div><span>03</span><strong>{moderatorCount}</strong><small>Modérateurs</small></div>
          <div><span>04</span><strong>{suspendedCount}</strong><small>Suspensions actives</small></div>
        </div>

        <div className="admin-members-layout">
          <section className="admin-panel admin-members-registry" aria-labelledby="members-registry-title">
            <header className="admin-panel__head">
              <div>
                <p className="eyebrow">Registre</p>
                <h2 id="members-registry-title">Comptes membres</h2>
              </div>
              <span className="admin-panel__status">{filteredMembers.length} / {members.length}</span>
            </header>

            <form className="admin-cms-filters" method="get">
              <label>
                <span>Recherche</span>
                <input name="q" type="search" defaultValue={search} placeholder="Pseudo, identifiant ou e-mail…" />
              </label>
              <label>
                <span>Rôle</span>
                <select name="role" defaultValue={roleFilter}>
                  <option value="">Tous</option>
                  <option value="member">Membres</option>
                  <option value="moderator">Modérateurs</option>
                  <option value="admin">Administrateurs</option>
                </select>
              </label>
              <label>
                <span>Participation</span>
                <select name="statut" defaultValue={statusFilter}>
                  <option value="">Tous</option>
                  <option value="active">Actifs</option>
                  <option value="suspended">Suspendus</option>
                </select>
              </label>
              <button className="button button--ghost button--small" type="submit">Filtrer</button>
              {(search || roleFilter || statusFilter) ? <Link className="text-link" href="/administration/membres">Réinitialiser</Link> : null}
            </form>

            {members.length === 0 ? (
              <div className="admin-empty-state">
                <strong>Aucun membre chargé.</strong>
                <p>Les nouveaux comptes apparaîtront ici automatiquement après inscription.</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="admin-empty-state">
                <strong>Aucun membre ne correspond aux filtres.</strong>
                <p>Élargissez la recherche ou réinitialisez les critères.</p>
                <Link className="text-link" href="/administration/membres">Réinitialiser les filtres →</Link>
              </div>
            ) : (
              <div className="admin-member-cards">
                {filteredMembers.map((member) => {
                  const effectiveSuspended = isEffectiveSuspension(member);
                  const expiredSuspension = member.participation_status === "suspended" && !effectiveSuspended;
                  const isSelf = member.user_id === claims.sub;
                  const lastAdminSelf = isSelf && member.member_role === "admin" && adminCount <= 1;

                  return (
                    <article className="admin-member-card" key={member.user_id}>
                      <header className="admin-member-card__identity">
                        <span className="admin-member-card__avatar" aria-hidden="true">
                          {member.display_name.slice(0, 1).toUpperCase()}
                        </span>
                        <div>
                          <div className="admin-member-card__name-line">
                            <h3>{member.display_name}</h3>
                            {isSelf ? <span className="admin-member-card__self">Votre compte</span> : null}
                          </div>
                          <p>{member.username ? `@${member.username}` : "Identifiant non défini"}</p>
                          <small>{member.email ?? "Adresse e-mail indisponible"}</small>
                        </div>
                        <div className="admin-member-card__badges">
                          <span className={`admin-member-role admin-member-role--${member.member_role}`}>{roleLabel(member.member_role)}</span>
                          <span className={member.email_confirmed ? "is-confirmed" : "is-unconfirmed"}>
                            {member.email_confirmed ? "E-mail confirmé" : "E-mail à confirmer"}
                          </span>
                          <span className={effectiveSuspended ? "is-suspended" : expiredSuspension ? "is-expired" : "is-active"}>
                            {effectiveSuspended ? "Participation suspendue" : expiredSuspension ? "Suspension expirée" : "Participation active"}
                          </span>
                        </div>
                      </header>

                      <div className="admin-member-card__facts">
                        <span><small>Inscription</small><strong>{formatDate(member.created_at)}</strong></span>
                        <span><small>Dernière connexion</small><strong>{formatDate(member.last_sign_in_at, true)}</strong></span>
                        {member.suspended_until ? (
                          <span><small>Fin de suspension</small><strong>{formatDate(member.suspended_until, true)}</strong></span>
                        ) : null}
                      </div>

                      {member.suspension_reason && member.participation_status === "suspended" ? (
                        <div className="admin-member-card__reason">
                          <strong>Motif</strong>
                          <p>{member.suspension_reason}</p>
                        </div>
                      ) : null}

                      <div className="admin-member-card__controls">
                        <form className="admin-member-role-form" action={changeMemberRole}>
                          <input type="hidden" name="user_id" value={member.user_id} />
                          <label>
                            <span>Rôle communautaire</span>
                            <select name="role" defaultValue={member.member_role} disabled={lastAdminSelf}>
                              <option value="member">Membre</option>
                              <option value="moderator">Modérateur</option>
                              <option value="admin">Administrateur</option>
                            </select>
                          </label>
                          <button className="button button--ghost button--small" type="submit" disabled={lastAdminSelf}>
                            Enregistrer le rôle
                          </button>
                          {lastAdminSelf ? <small>Le dernier administrateur ne peut pas se rétrograder.</small> : null}
                        </form>

                        {effectiveSuspended || expiredSuspension ? (
                          <form className="admin-member-reactivate-form" action={reactivateMember}>
                            <input type="hidden" name="user_id" value={member.user_id} />
                            <div>
                              <strong>{expiredSuspension ? "Suspension arrivée à échéance" : "Participation bloquée"}</strong>
                              <small>{expiredSuspension ? "Le membre peut déjà republier. Nettoyez le statut pour clôturer la mesure." : "La lecture et la connexion restent disponibles."}</small>
                            </div>
                            <button className="button button--primary button--small" type="submit">Réactiver</button>
                          </form>
                        ) : isSelf ? (
                          <div className="admin-member-self-guard">
                            <strong>Votre compte administrateur</strong>
                            <small>L’auto-suspension est bloquée pour éviter de perdre l’accès de gestion.</small>
                          </div>
                        ) : (
                          <form className="admin-member-suspend-form" action={suspendMember}>
                            <input type="hidden" name="user_id" value={member.user_id} />
                            <label className="admin-member-suspend-form__reason">
                              <span>Motif de suspension</span>
                              <input name="reason" type="text" minLength={3} maxLength={500} placeholder="Motif interne de modération" required />
                            </label>
                            <label>
                              <span>Durée</span>
                              <select name="duration" defaultValue="7d">
                                <option value="1d">24 heures</option>
                                <option value="7d">7 jours</option>
                                <option value="30d">30 jours</option>
                                <option value="indefinite">Indéfinie</option>
                              </select>
                            </label>
                            <button className="button button--ghost button--small" type="submit">Suspendre la participation</button>
                          </form>
                        )}
                      </div>

                      <div className={destructiveStyles.memberDanger}>
                        <div className={destructiveStyles.memberDangerText}>
                          <strong>Suppression définitive</strong>
                          <small>
                            Le compte Auth, le profil, les personnages, relations, notifications et fichiers personnels seront effacés. Les anciens sujets et messages restent anonymisés.
                          </small>
                        </div>
                        {isSelf ? (
                          <button className={`button button--ghost button--small ${destructiveStyles.dangerButton}`} type="button" disabled>
                            Votre compte
                          </button>
                        ) : (
                          <form action={deleteMember}>
                            <input type="hidden" name="user_id" value={member.user_id} />
                            <ConfirmDeleteButton
                              className={`button button--ghost button--small ${destructiveStyles.dangerButton}`}
                              label="Supprimer le membre"
                              confirmMessage={`Supprimer définitivement le compte de « ${member.display_name} » ? Son compte, ses personnages, relations, notifications et fichiers personnels seront effacés. Ses anciens sujets et messages resteront visibles sous « Compte supprimé ». Cette action est irréversible.`}
                            />
                          </form>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="admin-panel admin-members-history" aria-labelledby="members-history-title">
            <header className="admin-panel__head">
              <div>
                <p className="eyebrow">Traçabilité</p>
                <h2 id="members-history-title">Historique</h2>
              </div>
            </header>

            {events.length === 0 ? (
              <div className="admin-empty-state admin-empty-state--compact">
                <strong>Aucune action enregistrée.</strong>
                <p>Les changements de rôle et suspensions apparaîtront ici.</p>
              </div>
            ) : (
              <div className="admin-moderation-history">
                {events.map((event) => {
                  const target = memberMap.get(event.target_user_id);
                  const actor = event.actor_user_id ? memberMap.get(event.actor_user_id) : null;
                  return (
                    <article key={event.id}>
                      <span aria-hidden="true">{event.event_type === "role_changed" ? "◇" : event.event_type === "participation_suspended" ? "!" : "✓"}</span>
                      <div>
                        <strong>{eventLabel(event)}</strong>
                        <p>{target?.display_name ?? "Compte supprimé"}</p>
                        <small>Par {actor?.display_name ?? "Système"} · {formatDate(event.created_at, true)}</small>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="admin-panel__note">
              <strong>Suspension de participation</strong>
              <p>Elle bloque les créations et modifications de sujets, messages et personnages. Elle ne supprime aucune donnée et n’empêche pas la lecture.</p>
            </div>
          </aside>
        </div>

        <footer className="admin-members-footer">
          <Link className="text-link" href="/administration">← Retour au tableau de bord</Link>
          <span>Les autorisations sensibles sont vérifiées côté PostgreSQL, pas uniquement dans l’interface.</span>
        </footer>
      </section>
    </main>
  );
}
