import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { relationshipKinds, type RelationshipKind } from "@/content/relationship-content";
import { createClient } from "@/lib/supabase/server";
import { moderateRelationship } from "./actions";

export const dynamic = "force-dynamic";

type Search = { message?: string; erreur?: string; q?: string; statut?: string; type?: string; visibilite?: string; moderation?: string };

const statusPriority: Record<string, number> = { pending: 0, revision_requested: 1, approved: 2, rejected: 3 };

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

function visibilityLabel(value: string) {
  if (value === "public") return "Publique";
  if (value === "unlisted") return "Non listée";
  return "Privée";
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date(value));
}

function notice(message?: string, error?: string) {
  if (error === "motif") return { kind: "error", text: "Indiquez un motif de modération avant de masquer la relation." };
  if (error) return { kind: "error", text: "L’action n’a pas pu être enregistrée." };
  if (message === "hide") return { kind: "success", text: "La relation a été masquée du sociogramme public." };
  if (message === "restore") return { kind: "success", text: "La relation a été restaurée. Sa publication dépend toujours des deux approbations et de sa visibilité." };
  return null;
}

export default async function AdminRelationshipsPage({ searchParams }: { searchParams: Promise<Search> }) {
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
    .limit(250);
  const rows = relationships ?? [];
  const characterIds = Array.from(new Set(rows.flatMap((relationship) => [relationship.source_character_id, relationship.target_character_id])));
  const { data: characters } = characterIds.length
    ? await supabase.from("characters").select("id, slug, name, owner_id").in("id", characterIds)
    : { data: [] as { id: string; slug: string; name: string; owner_id: string }[] };
  const characterMap = new Map((characters ?? []).map((character) => [character.id, character]));
  const pageNotice = notice(query.message, query.erreur);

  const search = String(query.q ?? "").trim().slice(0, 120);
  const statusFilter = String(query.statut ?? "").trim();
  const kindFilter = String(query.type ?? "").trim();
  const visibilityFilter = String(query.visibilite ?? "").trim();
  const moderationFilter = String(query.moderation ?? "").trim();
  const needle = search.toLocaleLowerCase("fr");

  const approvedCount = rows.filter((relationship) => relationship.status === "approved").length;
  const pendingCount = rows.filter((relationship) => relationship.status === "pending").length;
  const revisionCount = rows.filter((relationship) => relationship.status === "revision_requested").length;
  const hiddenCount = rows.filter((relationship) => relationship.is_moderation_hidden).length;
  const publicCount = rows.filter((relationship) => relationship.status === "approved" && relationship.source_approved && relationship.target_approved && relationship.visibility === "public" && !relationship.is_moderation_hidden).length;
  const attentionCount = pendingCount + revisionCount;

  const filteredRows = rows.filter((relationship) => {
    const source = characterMap.get(relationship.source_character_id);
    const target = characterMap.get(relationship.target_character_id);
    const searchable = `${relationship.label} ${relationship.description ?? ""} ${relationship.decision_note ?? ""} ${source?.name ?? ""} ${target?.name ?? ""}`.toLocaleLowerCase("fr");
    return (!statusFilter || relationship.status === statusFilter)
      && (!kindFilter || relationship.kind === kindFilter)
      && (!visibilityFilter || relationship.visibility === visibilityFilter)
      && (moderationFilter !== "hidden" || relationship.is_moderation_hidden)
      && (moderationFilter !== "visible" || !relationship.is_moderation_hidden)
      && (!needle || searchable.includes(needle));
  }).sort((a, b) => {
    const moderationDelta = Number(b.is_moderation_hidden) - Number(a.is_moderation_hidden);
    if (moderationDelta) return moderationDelta;
    const statusDelta = (statusPriority[a.status] ?? 99) - (statusPriority[b.status] ?? 99);
    if (statusDelta) return statusDelta;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const filtersActive = Boolean(search || statusFilter || kindFilter || visibilityFilter || moderationFilter);

  return (
    <main className="site-shell admin-page admin-relationships-page">
      <SiteHeader />
      <section className="admin-hero">
        <div className="content-frame admin-hero__layout">
          <div><p className="eyebrow">Administration · Liens</p><h1>Relations personnage</h1><p>Surveillez le sociogramme, repérez les demandes en attente et masquez un contenu problématique sans décider à la place des propriétaires.</p></div>
          <div className="admin-hero__side"><span className="admin-role-badge">✦ Administrateur</span><Link className="button button--ghost button--small" href="/liens">Voir le sociogramme</Link></div>
        </div>
      </section>

      <section className="content-frame admin-workspace">
        {pageNotice ? <div className={`admin-alert admin-alert--${pageNotice.kind}`} role="status">{pageNotice.text}</div> : null}
        {error ? <div className="admin-alert" role="alert">Les relations n’ont pas pu être chargées depuis Supabase.</div> : null}

        <div className="admin-metrics" aria-label="Indicateurs relations">
          <article className="admin-metric"><span>01</span><div><strong>{rows.length}</strong><small>Total</small></div></article>
          <article className="admin-metric"><span>02</span><div><strong>{attentionCount}</strong><small>À traiter</small></div></article>
          <article className="admin-metric"><span>03</span><div><strong>{approvedCount}</strong><small>Approuvées</small></div></article>
          <article className="admin-metric"><span>04</span><div><strong>{hiddenCount}</strong><small>Masquées</small></div></article>
          <article className="admin-metric"><span>05</span><div><strong>{publicCount}</strong><small>Publiques</small></div></article>
        </div>

        <section className="admin-panel" aria-labelledby="admin-relations-title">
          <header className="admin-panel__head">
            <div><p className="eyebrow">Sociogramme</p><h2 id="admin-relations-title">Toutes les relations</h2></div>
            <span className="admin-panel__status">{attentionCount ? `${attentionCount} à traiter` : "File à jour"}</span>
          </header>

          <form className="admin-cms-filters admin-cms-filters--wide" method="get">
            <label><span>Recherche</span><input name="q" type="search" defaultValue={search} placeholder="Relation ou personnage…" /></label>
            <label><span>Statut</span><select name="statut" defaultValue={statusFilter}><option value="">Tous</option><option value="pending">En attente</option><option value="revision_requested">Révision demandée</option><option value="approved">Validées</option><option value="rejected">Refusées</option></select></label>
            <label><span>Type</span><select name="type" defaultValue={kindFilter}><option value="">Tous</option>{Object.entries(relationshipKinds).map(([value, item]) => <option value={value} key={value}>{item.label}</option>)}</select></label>
            <label><span>Visibilité</span><select name="visibilite" defaultValue={visibilityFilter}><option value="">Toutes</option><option value="public">Publique</option><option value="unlisted">Non listée</option><option value="private">Privée</option></select></label>
            <label><span>Modération</span><select name="moderation" defaultValue={moderationFilter}><option value="">Toutes</option><option value="visible">Non masquées</option><option value="hidden">Masquées</option></select></label>
            <button className="button button--ghost button--small" type="submit">Filtrer</button>
            {filtersActive ? <Link className="text-link" href="/administration/liens">Réinitialiser</Link> : null}
          </form>
          <p className="admin-filter-result">{filteredRows.length} résultat{filteredRows.length > 1 ? "s" : ""} sur {rows.length}{filtersActive ? " · filtres actifs" : ""}</p>

          {attentionCount && !filtersActive ? (
            <div className="admin-panel__note"><strong>File active</strong><p>Les relations en attente ou en révision sont placées avant les relations déjà décidées. Les relations masquées restent visibles ici pour permettre leur restauration.</p></div>
          ) : null}

          {filteredRows.length ? (
            <div className="admin-relationship-list">
              {filteredRows.map((relationship) => {
                const source = characterMap.get(relationship.source_character_id);
                const target = characterMap.get(relationship.target_character_id);
                const kind = relationship.kind as RelationshipKind;
                return (
                  <article className={`admin-relationship-row${relationship.is_moderation_hidden ? " is-hidden" : ""}`} key={relationship.id}>
                    <div className="admin-relationship-row__head">
                      <span>{statusLabel(relationship.status)}</span>
                      <span>{relationshipKinds[kind]?.label ?? relationship.kind}</span>
                      <span>{visibilityLabel(relationship.visibility)}</span>
                      <span>{relationship.source_approved ? "Source ✓" : "Source …"}</span>
                      <span>{relationship.target_approved ? "Cible ✓" : "Cible …"}</span>
                      {relationship.is_moderation_hidden ? <span>Masquée</span> : null}
                    </div>
                    <h3>{relationship.label}</h3>
                    <p><Link className="text-link" href={source ? `/personnages/${source.slug}` : "/personnages"}>{source?.name ?? "Personnage source supprimé"}</Link> ↔ <Link className="text-link" href={target ? `/personnages/${target.slug}` : "/personnages"}>{target?.name ?? "Personnage cible supprimé"}</Link></p>
                    {relationship.description ? <p>{relationship.description}</p> : null}
                    <small>Intensité {relationship.intensity}/3 · mise à jour {formatDate(relationship.updated_at)}</small>
                    {relationship.decision_note ? <p><strong>Décision propriétaire :</strong> {relationship.decision_note}</p> : null}
                    {relationship.is_moderation_hidden && relationship.moderation_note ? <p><strong>Motif de modération :</strong> {relationship.moderation_note}</p> : null}
                    <div className="admin-relationship-row__actions">
                      {relationship.is_moderation_hidden ? (
                        <form action={moderateRelationship}><input type="hidden" name="relationship_id" value={relationship.id} /><input type="hidden" name="action" value="restore" /><span>Masquée {formatDate(relationship.moderated_at)}</span><button className="button button--primary button--small" type="submit">Restaurer</button></form>
                      ) : (
                        <form action={moderateRelationship}><input type="hidden" name="relationship_id" value={relationship.id} /><input type="hidden" name="action" value="hide" /><input name="reason" minLength={3} maxLength={1000} required placeholder="Motif interne du masquage…" /><button className="button button--ghost button--small" type="submit">Masquer</button></form>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : <div className="admin-empty-state"><strong>{rows.length ? "Aucune relation ne correspond aux filtres." : "Aucune relation en base."}</strong><p>{rows.length ? "Élargissez les critères ou réinitialisez les filtres." : "Les premières propositions des membres apparaîtront ici automatiquement."}</p>{rows.length ? <Link className="text-link" href="/administration/liens">Réinitialiser les filtres →</Link> : null}</div>}
        </section>
      </section>
    </main>
  );
}
