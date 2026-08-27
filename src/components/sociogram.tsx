"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { relationshipKinds, type RelationshipKind } from "@/content/relationship-content";

export type SociogramCharacter = {
  id: string;
  slug: string;
  displayName: string;
  epithet: string;
  people: string;
  occupation: string;
  initials: string;
  portraitUrl?: string | null;
};

export type SociogramRelationship = {
  id: string;
  sourceCharacterId: string;
  targetCharacterId: string;
  kind: RelationshipKind;
  label: string;
  description: string;
  intensity: 1 | 2 | 3;
};

type FilterKind = "all" | RelationshipKind;

function graphPositions(characters: SociogramCharacter[]) {
  const positions = new Map<string, { x: number; y: number }>();
  const total = characters.length;
  if (total === 1) {
    positions.set(characters[0].id, { x: 50, y: 50 });
    return positions;
  }
  if (total === 2) {
    positions.set(characters[0].id, { x: 32, y: 50 });
    positions.set(characters[1].id, { x: 68, y: 50 });
    return positions;
  }

  characters.forEach((character, index) => {
    const outer = index < 8;
    const ringIndex = outer ? index : index - 8;
    const ringTotal = outer ? Math.min(total, 8) : Math.max(1, total - 8);
    const angle = -Math.PI / 2 + (Math.PI * 2 * ringIndex) / ringTotal;
    const radiusX = outer ? 34 : 19;
    const radiusY = outer ? 35 : 19;
    positions.set(character.id, {
      x: 50 + Math.cos(angle) * radiusX,
      y: 50 + Math.sin(angle) * radiusY,
    });
  });
  return positions;
}

function otherCharacterId(relationship: SociogramRelationship, selectedId: string) {
  return relationship.sourceCharacterId === selectedId ? relationship.targetCharacterId : relationship.sourceCharacterId;
}

export function Sociogram({
  characters,
  relationships,
}: {
  characters: SociogramCharacter[];
  relationships: SociogramRelationship[];
}) {
  const [selectedId, setSelectedId] = useState(characters[0]?.id ?? "");
  const [selectedRelationId, setSelectedRelationId] = useState<string | null>(relationships[0]?.id ?? null);
  const [filter, setFilter] = useState<FilterKind>("all");
  const positions = useMemo(() => graphPositions(characters), [characters]);

  if (characters.length === 0) {
    return (
      <div className="sociogram-workspace sociogram-workspace--empty">
        <div className="sociogram-live-empty"><strong>Le réseau est encore vide.</strong><p>Les personnages publiés apparaîtront ici, puis les relations validées relieront progressivement le sociogramme.</p></div>
      </div>
    );
  }

  const selectedCharacter = characters.find((character) => character.id === selectedId) ?? characters[0];
  const selectedRelation = relationships.find((relationship) => relationship.id === selectedRelationId) ?? null;
  const visibleRelationships = relationships.filter((relationship) => filter === "all" || relationship.kind === filter);
  const characterRelations = relationships.filter((relationship) => relationship.sourceCharacterId === selectedCharacter.id || relationship.targetCharacterId === selectedCharacter.id);

  return (
    <div className="sociogram-workspace">
      <div className="sociogram-toolbar">
        <div>
          <span className="sociogram-toolbar__label">Afficher</span>
          <div className="sociogram-filters" role="group" aria-label="Filtrer les relations">
            <button className={filter === "all" ? "is-active" : ""} type="button" onClick={() => setFilter("all")}>Toutes</button>
            {(Object.entries(relationshipKinds) as Array<[RelationshipKind, { label: string; shortLabel: string }]>).map(([kind, meta]) => (
              <button className={filter === kind ? "is-active" : ""} type="button" key={kind} onClick={() => setFilter(kind)}>{meta.shortLabel}</button>
            ))}
          </div>
        </div>
        <div className="sociogram-toolbar__meta"><span><strong>{characters.length}</strong> personnages</span><span><strong>{relationships.length}</strong> relations</span></div>
      </div>

      <div className="sociogram-layout">
        <section className="sociogram-canvas" aria-label="Carte interactive des relations">
          <div className="sociogram-canvas__grid" aria-hidden="true" />
          <svg className="sociogram-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {visibleRelationships.map((relationship) => {
              const source = positions.get(relationship.sourceCharacterId);
              const target = positions.get(relationship.targetCharacterId);
              if (!source || !target) return null;
              const focused = selectedRelationId === relationship.id || relationship.sourceCharacterId === selectedCharacter.id || relationship.targetCharacterId === selectedCharacter.id;
              return <line key={relationship.id} x1={source.x} y1={source.y} x2={target.x} y2={target.y} className={`sociogram-line sociogram-line--${relationship.kind}${focused ? " is-focused" : ""}`} vectorEffect="non-scaling-stroke" />;
            })}
          </svg>

          {visibleRelationships.map((relationship) => {
            const source = positions.get(relationship.sourceCharacterId);
            const target = positions.get(relationship.targetCharacterId);
            if (!source || !target) return null;
            const x = (source.x + target.x) / 2;
            const y = (source.y + target.y) / 2;
            return (
              <button className={`sociogram-edge-label sociogram-edge-label--${relationship.kind}${selectedRelationId === relationship.id ? " is-selected" : ""}`} style={{ left: `${x}%`, top: `${y}%` }} type="button" key={relationship.id} onClick={() => { setSelectedRelationId(relationship.id); setSelectedId(relationship.sourceCharacterId); }}>
                {relationshipKinds[relationship.kind].shortLabel}
              </button>
            );
          })}

          {characters.map((character) => {
            const position = positions.get(character.id) ?? { x: 50, y: 50 };
            const connected = relationships.some((relationship) => relationship.sourceCharacterId === character.id || relationship.targetCharacterId === character.id);
            return (
              <button key={character.id} className={`sociogram-node${selectedCharacter.id === character.id ? " is-selected" : ""}${connected ? " is-connected" : ""}`} style={{ left: `${position.x}%`, top: `${position.y}%` }} type="button" onClick={() => {
                setSelectedId(character.id);
                setSelectedRelationId(relationships.find((relationship) => relationship.sourceCharacterId === character.id || relationship.targetCharacterId === character.id)?.id ?? null);
              }}>
                <span className="sociogram-node__portrait" aria-hidden="true">{character.portraitUrl ? <img src={character.portraitUrl} alt="" /> : character.initials}</span>
                <span className="sociogram-node__copy"><small>{character.people || "Personnage"}</small><strong>{character.displayName}</strong><span>{character.occupation || "Occupation non renseignée"}</span></span>
              </button>
            );
          })}
          <div className="sociogram-canvas__hint">Seules les relations approuvées par les deux propriétaires apparaissent ici.</div>
        </section>

        <aside className="sociogram-inspector" aria-live="polite">
          <section className="sociogram-inspector__character">
            <div className="sociogram-inspector__portrait" aria-hidden="true">{selectedCharacter.portraitUrl ? <img src={selectedCharacter.portraitUrl} alt="" /> : selectedCharacter.initials}</div>
            <div><p className="panel__kicker">Personnage sélectionné</p><h2>{selectedCharacter.displayName}</h2><p>{selectedCharacter.epithet || "Personnage d’Imetheran"}</p></div>
            <Link className="text-link" href={`/personnages/${selectedCharacter.slug}`}>Voir la fiche <span aria-hidden="true">→</span></Link>
          </section>

          <section className="sociogram-inspector__relations">
            <div className="sociogram-inspector__heading"><p className="panel__kicker">Relations validées</p><span>{characterRelations.length}</span></div>
            <div className="sociogram-relation-list">
              {characterRelations.length ? characterRelations.map((relationship) => {
                const counterpart = characters.find((character) => character.id === otherCharacterId(relationship, selectedCharacter.id));
                if (!counterpart) return null;
                return (
                  <button type="button" className={`sociogram-relation-item sociogram-relation-item--${relationship.kind}${selectedRelationId === relationship.id ? " is-active" : ""}`} key={relationship.id} onClick={() => setSelectedRelationId(relationship.id)}>
                    <span className="sociogram-relation-item__avatar">{counterpart.initials}</span>
                    <span><small>{relationshipKinds[relationship.kind].label}</small><strong>{counterpart.displayName}</strong><span>{relationship.label}</span></span>
                  </button>
                );
              }) : <p className="sociogram-live-empty-copy">Aucune relation publique validée.</p>}
            </div>
          </section>

          {selectedRelation ? (
            <section className={`sociogram-inspector__detail sociogram-inspector__detail--${selectedRelation.kind}`}>
              <div className="sociogram-inspector__heading"><p className="panel__kicker">Lien sélectionné</p><span>{"●".repeat(selectedRelation.intensity)}{"○".repeat(3 - selectedRelation.intensity)}</span></div>
              <h3>{selectedRelation.label}</h3><p>{selectedRelation.description || "Aucune description publique."}</p>
              <div className="sociogram-inspector__detail-meta"><span>{relationshipKinds[selectedRelation.kind].label}</span><span>Double approbation</span></div>
            </section>
          ) : null}
        </aside>
      </div>

      <div className="sociogram-legend" aria-label="Légende des types de relations">
        {(Object.entries(relationshipKinds) as Array<[RelationshipKind, { label: string; shortLabel: string }]>).map(([kind, meta]) => <span key={kind}><i className={`sociogram-legend__mark sociogram-legend__mark--${kind}`} />{meta.label}</span>)}
      </div>
    </div>
  );
}
