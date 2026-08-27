import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { relationshipKinds, type RelationshipKind } from "@/content/relationship-content";
import { createClient } from "@/lib/supabase/server";
import { moderateRelationship } from "./actions";

export const dynamic = "force-dynamic";

function getRole(appMetadata: unknown) {
  if (!appMetadata || typeof appMetadata !== "object" || !("role" in appMetadata)) return "member";
  return String((appMetadata as { role?: unknown }).role ?? "member");
}

function statusLabel(value: string) {
  if (value === "approved") return "Validée";
  if (value === "rejected") return "Refusée";
  if (value === "revision_requested") return "Révision demandée";
  return "En attente";
}

function notice(message?: string, error?: string) {
  if (error === "motif") return { kind: "error", text: "Indiquez un motif de modération avant de masquer la relation." };
  if (error) return { kind: "error", text: "L’action n’a pas pu être enregistrée." };
  if (message === "hide") return { kind: "success", text: "La relation a été masquée du sociogramme public." };
  if (message === "restore") return { kind: "success", text: "La relation a été restaurée. Sa publication dépend toujours des deux approbations et de sa visibilité." };
  return null;
}

export default async function AdminRelationshipsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; erreur?: string }>;
}) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (claimsError || !claims || typeof claims.sub !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fadministration%2Fliens");
  }
  if (getRole(claims.app_metadata) !== "admin") redirect("/compte");

  const { data: relationships, error } = await supabase
    .from("character_relationships")
    .select("id, source_character_id, target_character_id, kind, label, description, intensity, visibility, status, source_approved, target_approved, decision_note, is_moderation_hidden, moderation_note, moderated_at, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(150);
  const rows = relationships ?? [];
  const characterIds = Array.from(new Set(rows.flatMap((relationship) => [relationship.source_character_id, relationship.target_character_id])));
  const { data: characters } = characterIds.length
    ? await supabase.from("characters").select("id, slug, name, owner_id").in("id", characterIds)
    : { data: [] as { id: string; slug: string; name: string; owner_id: string }[] };
  const characterMap = new Map((characters ?? []).map((character) => [character.id, character]));
  const pageNotice = notice(query.message, query.erreur);
  const approvedCount = rows.filter((relationship) => relationship.status === "approved").length;
  const pendingCount = rows.filter((relationship) => relationship.status === "pending").length;
  const hiddenCount = rows.filter((relationship) => relationship.is_moderation_hidden).length;
  const publicCount = rows.filter((relationship) => relationship.status === "approved" && relationship.source_approved && relationship.target_approved && relationship.visibility === "public" && !relationship.is_moderation_hidden).length;

  return (
    <main className="site-shell admin-page admin-relationships-page">
      <SiteHeader />
      <section className="admin-hero">
        <div className="content-frame admin-hero__layout">
          <div><p className="eyebrow">Administration · Liens</p><h1>Relations personnage</h1><p>Surveillez le sociogramme et masquez un contenu problématique sans jamais approuver à la place des propriétaires.</p></div>
          <div className="admin-hero__side"><span className="admin-role-badge">✦ Administrateur</span><Link className="button button--ghost button--small" href="/liens">Voir le sociogramme</Link></div>
        </div>
      </section>

      <section className="content-frame admin-workspace">
        {pageNotice ? <div className={`admin-alert admin-alert--${pageNotice.kind}`} role="status">{pageNotice.text}</div> : null}
        {error ? <div className="admin-alert" role="alert">Les relations n’ont pas pu être chargées depuis Supabase.</div> : null}

        <div className="admin-metrics" aria-label="Indicateurs relations">
          <article className="admin-metric"><span>01</span><div><strong>{rows.length}</strong><small>Total</small></div></article>
          <article className="admin-metric"><span>02</span><div><strong>{pendingCount}</strong><small>En attente</small></div></article>
          <article className="admin-metric"><span>03</span><div><strong>{approvedCount}</strong><small>Approuvées</small></div></article>
          <article className="admin-metric"><span>04</span><div><strong>{hiddenCount}</strong><small>Masquées</small></div></article>
        </div>

        <section className="admin-panel" aria-labelledby="admin-relations-title">
          <header className="admin-panel__head"><div><p className="eyebrow">Sociogramme</p><h2 id="admin-relations-title">Toutes les relations</h2></div><span className="admin-panel__status">{publicCount} publiques</span></header>
          {rows.length ? (
            <div className="admin-relationship-list">
              {rows.map((relationship) => {
                const source = characterMap.get(relationship.source_character_id);
                const target = characterMap.get(relationship.target_character_id);
                const kind = relationship.kind as RelationshipKind;
                return (
                  <article className={`admin-relationship-row${relationship.is_moderation_hidden ? " is-hidden" : ""}`} key={relationship.id}>
                    <div className="admin-relationship-row__head">
                      <span>{statusLabel(relationship.status)}</span>
                      <span>{relationshipKinds[kind]?.label ?? relationship.kind}</span>
                      <span>{relationship.visibility}</span>
                      <span>{relationship.source_approved ? "Source ✓" : "Source …"}</span>
                      <span>{relationship.target_approved ? "Cible ✓" : "Cible …"}</span>
                      {relationship.is_moderation_hidden ? <span>Masquée</span> : null}
                    </div>
                    <h3>{relationship.label}</h3>
                    <p><Link className="text-link" href={source ? `/personnages/${source.slug}` : "/personnages"}>{source?.name ?? "Personnage source"}</Link> ↔ <Link className="text-link" href={target ? `/personnages/${target.slug}` : "/personnages"}>{target?.name ?? "Personnage cible"}</Link></p>
                    {relationship.description ? <p>{relationship.description}</p> : null}
                    {relationship.decision_note ? <p><strong>Décision propriétaire :</strong> {relationship.decision_note}</p> : null}
                    {relationship.is_moderation_hidden && relationship.moderation_note ? <p><strong>Motif de modération :</strong> {relationship.moderation_note}</p> : null}
                    <div className="admin-relationship-row__actions">
                      {relationship.is_moderation_hidden ? (
                        <form action={moderateRelationship}><input type="hidden" name="relationship_id" value={relationship.id} /><input type="hidden" name="action" value="restore" /><button className="button button--primary button--small" type="submit">Restaurer</button></form>
                      ) : (
                        <form action={moderateRelationship}><input type="hidden" name="relationship_id" value={relationship.id} /><input type="hidden" name="action" value="hide" /><input name="reason" minLength={3} maxLength={1000} required placeholder="Motif interne du masquage…" /><button className="button button--ghost button--small" type="submit">Masquer</button></form>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : <div className="admin-empty-state"><strong>Aucune relation en base.</strong><p>Les premières propositions des membres apparaîtront ici automatiquement.</p></div>}
        </section>
      </section>
    </main>
  );
}
