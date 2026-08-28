import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Sociogram, type SociogramCharacter, type SociogramRelationship } from "@/components/sociogram";
import { ThemeToggle } from "@/components/theme-toggle";
import { relationshipKinds, type RelationshipKind } from "@/content/relationship-content";
import { signedCharacterPortraitMap } from "@/lib/character-portraits";
import { createClient } from "@/lib/supabase/server";
import {
  createCharacterRelationship,
  respondCharacterRelationship,
  reviseCharacterRelationship,
  withdrawCharacterRelationship,
} from "./actions";

export const dynamic = "force-dynamic";

type CharacterRow = {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  epithet: string;
  people: string;
  occupation: string;
  portrait_path: string | null;
  status: string;
  visibility: string;
  is_moderation_hidden: boolean;
};

type RelationshipRow = {
  id: string;
  source_character_id: string;
  target_character_id: string;
  kind: RelationshipKind;
  label: string;
  description: string;
  intensity: number;
  visibility: string;
  status: string;
  source_approved: boolean;
  target_approved: boolean;
  created_by: string | null;
  decision_note: string;
  is_moderation_hidden: boolean;
  created_at: string;
  updated_at: string;
};

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase("fr") ?? "").join("") || "IM";
}

function relationStatus(status: string) {
  if (status === "approved") return "Validée";
  if (status === "rejected") return "Refusée";
  if (status === "revision_requested") return "Révision demandée";
  return "En attente";
}

function notice(message?: string, error?: string) {
  if (error === "doublon") return { kind: "error", text: "Un lien actif de ce type existe déjà entre ces deux personnages." };
  if (error === "cible") return { kind: "error", text: "Le personnage ciblé n’est plus disponible pour une nouvelle relation." };
  if (error === "suspendu") return { kind: "error", text: "Votre participation est actuellement suspendue." };
  if (error === "note") return { kind: "error", text: "Ajoutez une courte explication avant de refuser ou demander une révision." };
  if (error) return { kind: "error", text: "L’action n’a pas pu être enregistrée." };
  if (message === "proposition") return { kind: "success", text: "La proposition a été envoyée. Elle ne sera publique qu’après l’accord des deux propriétaires." };
  if (message === "approve") return { kind: "success", text: "Votre approbation est enregistrée." };
  if (message === "reject") return { kind: "success", text: "La relation a été refusée." };
  if (message === "revision") return { kind: "success", text: "La relation a été révisée et les approbations nécessaires ont été réinitialisées." };
  if (message === "retire") return { kind: "success", text: "La relation a été retirée." };
  return null;
}

export default async function LinksPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; erreur?: string }>;
}) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;

  const publicCharactersResult = await supabase
    .from("characters")
    .select("id, owner_id, slug, name, epithet, people, occupation, portrait_path, status, visibility, is_moderation_hidden")
    .eq("status", "published")
    .eq("visibility", "public")
    .eq("is_moderation_hidden", false)
    .order("name");
  const publicCharacters = (publicCharactersResult.data ?? []) as CharacterRow[];

  const publicRelationsResult = await supabase
    .from("character_relationships")
    .select("id, source_character_id, target_character_id, kind, label, description, intensity, visibility, status, source_approved, target_approved, created_by, decision_note, is_moderation_hidden, created_at, updated_at")
    .eq("status", "approved")
    .eq("source_approved", true)
    .eq("target_approved", true)
    .eq("visibility", "public")
    .eq("is_moderation_hidden", false)
    .order("updated_at", { ascending: false });
  const publicRelations = (publicRelationsResult.data ?? []) as RelationshipRow[];

  const graphCharacterIds = new Set(publicCharacters.map((character) => character.id));
  const graphRelationships: SociogramRelationship[] = publicRelations
    .filter((relationship) => graphCharacterIds.has(relationship.source_character_id) && graphCharacterIds.has(relationship.target_character_id))
    .map((relationship) => ({
      id: relationship.id,
      sourceCharacterId: relationship.source_character_id,
      targetCharacterId: relationship.target_character_id,
      kind: relationship.kind,
      label: relationship.label,
      description: relationship.description,
      intensity: (relationship.intensity >= 3 ? 3 : relationship.intensity <= 1 ? 1 : 2) as 1 | 2 | 3,
    }));
  const portraitMap = await signedCharacterPortraitMap(supabase, publicCharacters);
  const graphCharacters: SociogramCharacter[] = publicCharacters.map((character) => ({
    id: character.id,
    slug: character.slug,
    displayName: character.name,
    epithet: character.epithet ?? "",
    people: character.people ?? "",
    occupation: character.occupation ?? "",
    initials: initials(character.name),
    portraitUrl: portraitMap.get(character.id) ?? null,
  }));

  let ownCharacters: CharacterRow[] = [];
  let involvedRelationships: RelationshipRow[] = [];
  if (userId) {
    const [ownResult, relationshipResult] = await Promise.all([
      supabase
        .from("characters")
        .select("id, owner_id, slug, name, epithet, people, occupation, portrait_path, status, visibility, is_moderation_hidden")
        .eq("owner_id", userId)
        .order("name"),
      supabase
        .from("character_relationships")
        .select("id, source_character_id, target_character_id, kind, label, description, intensity, visibility, status, source_approved, target_approved, created_by, decision_note, is_moderation_hidden, created_at, updated_at")
        .order("updated_at", { ascending: false }),
    ]);
    ownCharacters = (ownResult.data ?? []) as CharacterRow[];
    const ownIds = new Set(ownCharacters.map((character) => character.id));
    involvedRelationships = ((relationshipResult.data ?? []) as RelationshipRow[]).filter(
      (relationship) => ownIds.has(relationship.source_character_id) || ownIds.has(relationship.target_character_id),
    );
  }

  const allKnownCharacters = new Map<string, CharacterRow>();
  for (const character of publicCharacters) allKnownCharacters.set(character.id, character);
  for (const character of ownCharacters) allKnownCharacters.set(character.id, character);
  const ownIds = new Set(ownCharacters.map((character) => character.id));
  const targetCandidates = Array.from(allKnownCharacters.values()).filter((character) => !character.is_moderation_hidden);
  const requestsToReview = involvedRelationships.filter((relationship) => {
    if (relationship.status !== "pending") return false;
    const sourceNeeds = ownIds.has(relationship.source_character_id) && !relationship.source_approved;
    const targetNeeds = ownIds.has(relationship.target_character_id) && !relationship.target_approved;
    return sourceNeeds || targetNeeds;
  });
  const pageNotice = notice(query.message, query.erreur);

  return (
    <main className="site-shell links-page">
      <SiteHeader />

      <section className="links-hero" aria-labelledby="links-title">
        <div className="links-hero__image" aria-hidden="true" />
        <div className="links-hero__veil" aria-hidden="true" />
        <div className="content-frame links-hero__content">
          <p className="eyebrow">Sociogramme communautaire</p>
          <h1 id="links-title">Liens</h1>
          <p>Une cartographie vivante des affinités, dettes, rivalités et histoires réellement approuvées par les propriétaires des personnages concernés.</p>
          <div className="links-hero__actions"><ThemeToggle /><Link className="button button--ghost" href="/personnages">Voir les personnages</Link></div>
        </div>
      </section>

      <section className="links-intro content-frame" aria-labelledby="sociogram-title">
        <header className="section-heading section-heading--row">
          <div><p className="eyebrow">Carte des relations</p><h2 id="sociogram-title">Le réseau d’Imetheran</h2><p>Une relation n’apparaît ici que lorsqu’elle est publique, non masquée par l’équipe et approuvée par les deux propriétaires de personnages.</p></div>
          <span className="status-pill status-pill--quiet">{graphRelationships.length} relation{graphRelationships.length > 1 ? "s" : ""} validée{graphRelationships.length > 1 ? "s" : ""}</span>
        </header>
        <Sociogram characters={graphCharacters} relationships={graphRelationships} />
      </section>

      {userId ? (
        <section className="content-frame relationship-manager" aria-labelledby="relationship-manager-title">
          <header className="section-heading section-heading--row">
            <div><p className="eyebrow">Espace membre</p><h2 id="relationship-manager-title">Gérer mes relations</h2><p>Chaque changement de contenu réinitialise automatiquement l’accord de l’autre propriétaire.</p></div>
            <span className="status-pill status-pill--quiet">Double validation</span>
          </header>

          {pageNotice ? <div className={`relationship-notice relationship-notice--${pageNotice.kind}`} role="status">{pageNotice.text}</div> : null}

          <div className="relationship-manager__grid">
            <section className="relationship-panel">
              <div className="relationship-panel__head"><p className="panel__kicker">Nouvelle proposition</p><h3>Proposer un lien</h3></div>
              {ownCharacters.length > 0 && targetCandidates.length > 1 ? (
                <form className="relationship-form" action={createCharacterRelationship}>
                  <label><span>Mon personnage</span><select name="source_character_id" required>{ownCharacters.map((character) => <option value={character.id} key={character.id}>{character.name}</option>)}</select></label>
                  <label><span>Personnage lié</span><select name="target_character_id" required><option value="">Choisir…</option>{targetCandidates.map((character) => <option value={character.id} key={character.id}>{character.name}{character.owner_id === userId ? " · le mien" : ""}</option>)}</select></label>
                  <label><span>Type de relation</span><select name="kind" defaultValue="trust">{(Object.entries(relationshipKinds) as Array<[RelationshipKind, { label: string }]>).map(([kind, meta]) => <option value={kind} key={kind}>{meta.label}</option>)}</select></label>
                  <label><span>Intensité</span><select name="intensity" defaultValue="1"><option value="1">●○○</option><option value="2">●●○</option><option value="3">●●●</option></select></label>
                  <label className="relationship-form__wide"><span>Intitulé</span><input name="label" maxLength={120} required placeholder="Ex. Confiance prudente" /></label>
                  <label className="relationship-form__wide"><span>Description partagée</span><textarea name="description" rows={5} maxLength={3000} placeholder="Décrivez ce que les deux personnages partagent ou savent l’un de l’autre…" /></label>
                  <label className="relationship-form__wide"><span>Visibilité après validation</span><select name="visibility" defaultValue="public"><option value="public">Publique</option><option value="unlisted">Non répertoriée</option><option value="private">Privée</option></select></label>
                  <button className="button button--primary" type="submit">Envoyer la proposition</button>
                </form>
              ) : (
                <div className="relationship-empty"><strong>Il faut au moins deux personnages disponibles.</strong><p>Créez votre personnage puis attendez qu’un autre membre publie le sien, ou créez un second personnage vous appartenant.</p><Link className="text-link" href="/personnages/nouveau">Créer un personnage →</Link></div>
              )}
            </section>

            <section className="relationship-panel">
              <div className="relationship-panel__head"><p className="panel__kicker">À examiner</p><h3>Demandes reçues</h3><span>{requestsToReview.length}</span></div>
              {requestsToReview.length ? <div className="relationship-request-list">{requestsToReview.map((relationship) => {
                const source = allKnownCharacters.get(relationship.source_character_id);
                const target = allKnownCharacters.get(relationship.target_character_id);
                return (
                  <article className="relationship-request" key={relationship.id}>
                    <small>{relationshipKinds[relationship.kind].label} · {source?.name ?? "Personnage"} ↔ {target?.name ?? "Personnage"}</small>
                    <h4>{relationship.label}</h4><p>{relationship.description || "Aucune description."}</p>
                    <div className="relationship-request__actions">
                      <form action={respondCharacterRelationship}><input type="hidden" name="relationship_id" value={relationship.id} /><input type="hidden" name="decision" value="approve" /><button className="button button--primary button--small" type="submit">Approuver</button></form>
                      <details><summary>Demander une révision</summary><form action={respondCharacterRelationship}><input type="hidden" name="relationship_id" value={relationship.id} /><input type="hidden" name="decision" value="revision" /><textarea name="note" minLength={3} maxLength={1000} required rows={3} placeholder="Ce qui doit être ajusté…" /><button className="button button--ghost button--small" type="submit">Envoyer</button></form></details>
                      <details><summary>Refuser</summary><form action={respondCharacterRelationship}><input type="hidden" name="relationship_id" value={relationship.id} /><input type="hidden" name="decision" value="reject" /><textarea name="note" minLength={3} maxLength={1000} required rows={3} placeholder="Motif du refus…" /><button className="button button--ghost button--small" type="submit">Confirmer le refus</button></form></details>
                    </div>
                  </article>
                );
              })}</div> : <div className="relationship-empty"><strong>Aucune demande en attente.</strong><p>Les propositions nécessitant votre accord apparaîtront ici.</p></div>}
            </section>
          </div>

          <section className="relationship-panel relationship-panel--full">
            <div className="relationship-panel__head"><p className="panel__kicker">Historique personnel</p><h3>Relations de mes personnages</h3><span>{involvedRelationships.length}</span></div>
            {involvedRelationships.length ? <div className="relationship-owned-list">{involvedRelationships.map((relationship) => {
              const source = allKnownCharacters.get(relationship.source_character_id);
              const target = allKnownCharacters.get(relationship.target_character_id);
              return (
                <article className="relationship-owned" key={relationship.id}>
                  <div className="relationship-owned__main"><div className="relationship-owned__badges"><span>{relationStatus(relationship.status)}</span><span>{relationshipKinds[relationship.kind].label}</span><span>{relationship.visibility}</span>{relationship.is_moderation_hidden ? <span>Masquée par l’équipe</span> : null}</div><h4>{relationship.label}</h4><p>{source?.name ?? "Personnage"} ↔ {target?.name ?? "Personnage"}</p>{relationship.decision_note ? <blockquote>{relationship.decision_note}</blockquote> : null}</div>
                  <div className="relationship-owned__approval"><span className={relationship.source_approved ? "is-ok" : ""}>Source {relationship.source_approved ? "✓" : "…"}</span><span className={relationship.target_approved ? "is-ok" : ""}>Cible {relationship.target_approved ? "✓" : "…"}</span></div>
                  <details className="relationship-owned__edit"><summary>Proposer une modification</summary><form className="relationship-form relationship-form--compact" action={reviseCharacterRelationship}><input type="hidden" name="relationship_id" value={relationship.id} /><label><span>Type</span><select name="kind" defaultValue={relationship.kind}>{(Object.entries(relationshipKinds) as Array<[RelationshipKind, { label: string }]>).map(([kind, meta]) => <option value={kind} key={kind}>{meta.label}</option>)}</select></label><label><span>Intensité</span><select name="intensity" defaultValue={String(relationship.intensity)}><option value="1">●○○</option><option value="2">●●○</option><option value="3">●●●</option></select></label><label className="relationship-form__wide"><span>Intitulé</span><input name="label" maxLength={120} required defaultValue={relationship.label} /></label><label className="relationship-form__wide"><span>Description</span><textarea name="description" maxLength={3000} rows={4} defaultValue={relationship.description} /></label><label className="relationship-form__wide"><span>Visibilité</span><select name="visibility" defaultValue={relationship.visibility}><option value="public">Publique</option><option value="unlisted">Non répertoriée</option><option value="private">Privée</option></select></label><button className="button button--primary button--small" type="submit">Soumettre la modification</button></form></details>
                  <form className="relationship-owned__withdraw" action={withdrawCharacterRelationship}><input type="hidden" name="relationship_id" value={relationship.id} /><button className="button button--ghost button--small" type="submit">Retirer ce lien</button></form>
                </article>
              );
            })}</div> : <div className="relationship-empty"><strong>Aucune relation liée à vos personnages.</strong><p>Vos propositions et les demandes reçues seront conservées ici.</p></div>}
          </section>
        </section>
      ) : (
        <section className="content-frame relationship-guest-cta"><div><p className="eyebrow">Propriétaires de personnages</p><h2>Construire le réseau ensemble</h2><p>Connectez-vous pour proposer, approuver ou réviser les relations de vos personnages.</p></div><Link className="button button--primary" href="/connexion?message=connexion-requise&retour=%2Fliens">Connexion / inscription</Link></section>
      )}
    </main>
  );
}
