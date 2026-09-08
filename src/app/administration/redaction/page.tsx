import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { cmsRoleLabels, getAppRole, type CmsRole } from "@/lib/cms-access";
import { createClient } from "@/lib/supabase/server";
import { setCmsPermission } from "./actions";

export const dynamic = "force-dynamic";

type MemberRow = {
  user_id: string;
  display_name: string;
  username: string | null;
  email: string | null;
  member_role: "member" | "moderator" | "admin";
};

type CmsPermissionRow = {
  user_id: string;
  cms_role: CmsRole;
  can_chronicles: boolean;
  can_gazettes: boolean;
};

export default async function AdminEditorialAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; message?: string; erreur?: string }>;
}) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (claimsError || !claims || typeof claims.sub !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fadministration%2Fredaction");
  }
  if (getAppRole(claims.app_metadata) !== "admin") redirect("/compte");

  const [membersResult, permissionsResult] = await Promise.all([
    supabase.rpc("admin_list_members"),
    supabase.from("cms_permissions").select("user_id, cms_role, can_chronicles, can_gazettes").order("updated_at", { ascending: false }),
  ]);

  const members = (membersResult.data ?? []) as MemberRow[];
  const permissions = (permissionsResult.data ?? []) as CmsPermissionRow[];
  const permissionMap = new Map(permissions.map((row) => [row.user_id, row]));
  const search = String(query.q ?? "").trim().slice(0, 120);
  const needle = search.toLocaleLowerCase("fr");
  const filteredMembers = members.filter((member) =>
    !needle || `${member.display_name} ${member.username ?? ""} ${member.email ?? ""}`.toLocaleLowerCase("fr").includes(needle)
  );
  const contributorCount = permissions.filter((row) => row.cms_role === "contributor").length;
  const editorCount = permissions.filter((row) => row.cms_role === "editor").length;

  return (
    <main className="site-shell admin-page">
      <SiteHeader />
      <section className="admin-hero">
        <div className="content-frame admin-hero__layout">
          <div>
            <p className="eyebrow">Administration · CMS</p>
            <h1>Accès rédaction</h1>
            <p>Attribuez les droits éditoriaux indépendamment des rôles communautaires. Les contributeurs écrivent et soumettent ; les éditeurs relisent et valident avant publication finale par un administrateur.</p>
          </div>
          <div className="admin-hero__side">
            <span className="admin-role-badge">✦ Validation en deux étapes</span>
            <Link className="button button--ghost button--small" href="/administration">← Tableau de bord</Link>
          </div>
        </div>
      </section>

      <section className="content-frame admin-workspace">
        {query.message === "enregistre" ? <div className="admin-alert admin-alert--success">Les droits de rédaction ont été mis à jour.</div> : null}
        {query.erreur ? <div className="admin-alert" role="alert">Les droits n’ont pas pu être enregistrés.</div> : null}
        {membersResult.error || permissionsResult.error ? <div className="admin-alert" role="alert">Le registre des accès rédaction n’a pas pu être chargé complètement.</div> : null}

        <div className="admin-metrics" aria-label="Résumé des accès rédaction">
          <article className="admin-metric"><span>01</span><div><strong>{permissions.length}</strong><small>Accès CMS</small></div></article>
          <article className="admin-metric"><span>02</span><div><strong>{contributorCount}</strong><small>Contributeurs</small></div></article>
          <article className="admin-metric"><span>03</span><div><strong>{editorCount}</strong><small>Éditeurs</small></div></article>
          <article className="admin-metric"><span>04</span><div><strong>2</strong><small>Étapes de validation</small></div></article>
        </div>

        <section className="admin-panel">
          <header className="admin-panel__head">
            <div><p className="eyebrow">Permissions</p><h2>Qui peut écrire quoi ?</h2></div>
            <span className="admin-panel__status">{filteredMembers.length} membre{filteredMembers.length > 1 ? "s" : ""}</span>
          </header>

          <form className="admin-cms-filters" method="get">
            <label><span>Recherche</span><input name="q" type="search" defaultValue={search} placeholder="Pseudo, identifiant ou e-mail…" /></label>
            <button className="button button--ghost button--small" type="submit">Filtrer</button>
            {search ? <Link className="text-link" href="/administration/redaction">Réinitialiser</Link> : null}
          </form>

          <div className="admin-member-cards">
            {filteredMembers.map((member) => {
              const permission = permissionMap.get(member.user_id);
              const isAdmin = member.member_role === "admin";
              return (
                <article className="admin-member-card" key={member.user_id}>
                  <header className="admin-member-card__identity">
                    <span className="admin-member-card__avatar" aria-hidden="true">{member.display_name.slice(0, 1).toUpperCase()}</span>
                    <div>
                      <h3>{member.display_name}</h3>
                      <p>{member.username ? `@${member.username}` : "Identifiant non défini"}</p>
                      <small>{member.email ?? "Adresse e-mail indisponible"}</small>
                    </div>
                    <div className="admin-member-card__badges">
                      <span className={`admin-member-role admin-member-role--${member.member_role}`}>{member.member_role === "admin" ? "Administrateur" : member.member_role === "moderator" ? "Modérateur" : "Membre"}</span>
                      <span className={permission ? "is-confirmed" : "is-unconfirmed"}>{permission ? cmsRoleLabels[permission.cms_role] : isAdmin ? "Accès CMS implicite" : "Aucun accès CMS"}</span>
                    </div>
                  </header>

                  {isAdmin ? (
                    <div className="admin-member-self-guard">
                      <strong>Accès administrateur complet</strong>
                      <small>Les administrateurs peuvent gérer Chroniques et Gazettes sans permission CMS supplémentaire.</small>
                    </div>
                  ) : (
                    <form className="admin-member-role-form" action={setCmsPermission}>
                      <input type="hidden" name="user_id" value={member.user_id} />
                      <label>
                        <span>Rôle CMS</span>
                        <select name="cms_role" defaultValue={permission?.cms_role ?? "none"}>
                          <option value="none">Aucun accès</option>
                          <option value="contributor">Contributeur</option>
                          <option value="editor">Éditeur</option>
                        </select>
                      </label>
                      <label><span>Contenus autorisés</span></label>
                      <label><input type="checkbox" name="can_chronicles" defaultChecked={permission?.can_chronicles ?? false} /> Chroniques</label>
                      <label><input type="checkbox" name="can_gazettes" defaultChecked={permission?.can_gazettes ?? false} /> Gazettes</label>
                      <button className="button button--primary button--small" type="submit">Enregistrer les droits</button>
                    </form>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}
