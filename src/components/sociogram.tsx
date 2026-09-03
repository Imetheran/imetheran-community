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
    const ring = Math.floor(index / 8);
    const ringIndex = index % 8;
    const ringStart = ring * 8;
    const ringTotal = Math.min(8, total - ringStart);
    const radiusX = Math.max(14, 36 - ring * 10);
    const radiusY = Math.max(14, 36 - ring * 10);
    const angleOffset = ring % 2 === 0 ? -Math.PI / 2 : -Math.PI / 2 + Math.PI / Math.max(4, ringTotal);
    const angle = angleOffset + (Math.PI * 2 * ringIndex) / ringTotal;
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
  const [focusMode, setFocusMode] = useState(characters.length > 12);

  const availableKinds = useMemo(() => {
    const used = new Set(relationships.map((relationship) => relationship.kind));
    return (Object.entries(relationshipKinds) as Array<[RelationshipKind, { label: string; shortLabel: string }]>).filter(([kind]) => used.has(kind));
  }, [relationships]);

  if (characters.length === 0) {
    return (
      <div className="sociogram-workspace sociogram-workspace--empty">
        <div className="sociogram-live-empty"><strong>Le réseau est encore vide.</strong><p>Les personnages publiés apparaîtront ici, puis les relations validées relieront progressivement le sociogramme.</p></div>
      </div>
    );
  }

  const selectedCharacter = characters.find((character) => character.id === selectedId) ?? characters[0];
  const filteredRelationships = relationships.filter((relationship) => filter === "all" || relationship.kind === filter);
  const characterRelations = filteredRelationships.filter((relationship) => relationship.sourceCharacterId === selectedCharacter.id || relationship.targetCharacterId === selectedCharacter.id);
  const visibleRelationships = focusMode ? characterRelations : filteredRelationships;
  const visibleCharacterIds = new Set<string>();
  if (focusMode) {
    visibleCharacterIds.add(selectedCharacter.id);
    visibleRelationships.forEach((relationship) => {
      visibleCharacterIds.add(relationship.sourceCharacterId);
      visibleCharacterIds.add(relationship.targetCharacterId);
    });
  }
  const visibleCharacters = focusMode ? characters.filter((character) => visibleCharacterIds.has(character.id)) : characters;
  const positions = graphPositions(visibleCharacters);
  const selectedRelation = visibleRelationships.find((relationship) => relationship.id === selectedRelationId) ?? characterRelations[0] ?? null;

  function selectCharacter(characterId: string) {
    setSelectedId(characterId);
    const firstRelation = filteredRelationships.find((relationship) => relationship.sourceCharacterId === characterId || relationship.targetCharacterId === characterId);
    setSelectedRelationId(firstRelation?.id ?? null);
  }

  return (
    <div className="sociogram-workspace">
      <div className="sociogram-toolbar">
        <div className="sociogram-toolbar__filters">
          <span className="sociogram-toolbar__label">Afficher</span>
          <div className="sociogram-filters" role="group" aria-label="Filtrer les relations">
            <button className={filter === "all" ? "is-active" : ""} aria-pressed={filter === "all"} type="button" onClick={() => setFilter("all")}>Toutes</button>
            {availableKinds.map(([kind, meta]) => (
              <button className={filter === kind ? "is-active" : ""} aria-pressed={filter === kind} type="button" key={kind} onClick={() => setFilter(kind)}>{meta.shortLabel}</button>
            ))}
          </div>
        </div>

        <div className="sociogram-toolbar__navigation">
          <label>
            <span>Personnage</span>
            <select value={selectedCharacter.id} onChange={(event) => selectCharacter(event.target.value)}>
              {characters.map((character) => <option value={character.id} key={character.id}>{character.displayName}</option>)}
            </select>
          </label>
          <button className={`sociogram-focus-toggle${focusMode ? " is-active" : ""}`} type="button" aria-pressed={focusMode} onClick={() => setFocusMode((current) => !current)}>
            {focusMode ? "Autour du personnage" : "Réseau entier"}
          </button>
        </div>

        <div className="sociogram-toolbar__meta"><span><strong>{visibleCharacters.length}</strong> affiché{visibleCharacters.length > 1 ? "s" : ""}</span><span><strong>{visibleRelationships.length}</strong> lien{visibleRelationships.length > 1 ? "s" : ""}</span></div>
      </div>

      <div className="sociogram-layout">
        <section className="sociogram-canvas" aria-label="Carte interactive des relations">
          <div className="sociogram-canvas__grid" aria-hidden="true" />
          <svg className="sociogram-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {visibleRelationships.map((relationship) => {
              const source = positions.get(relationship.sourceCharacterId);
              const target = positions.get(relationship.targetCharacterId);
              if (!source || !target) return null;
              const focused = selectedRelation?.id === relationship.id || relationship.sourceCharacterId === selectedCharacter.id || relationship.targetCharacterId === selectedCharacter.id;
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
              <button className={`sociogram-edge-label sociogram-edge-label--${relationship.kind}${selectedRelation?.id === relationship.id ? " is-selected" : ""}`} style={{ left: `${x}%`, top: `${y}%` }} type="button" key={relationship.id} onClick={() => { setSelectedRelationId(relationship.id); setSelectedId(relationship.sourceCharacterId); }}>
                {relationshipKinds[relationship.kind].shortLabel}
              </button>
            );
          })}

          {visibleCharacters.map((character) => {
            const position = positions.get(character.id) ?? { x: 50, y: 50 };
            const connected = visibleRelationships.some((relationship) => relationship.sourceCharacterId === character.id || relationship.targetCharacterId === character.id);
            return (
              <button key={character.id} className={`sociogram-node${selectedCharacter.id === character.id ? " is-selected" : ""}${connected ? " is-connected" : ""}`} style={{ left: `${position.x}%`, top: `${position.y}%` }} type="button" onClick={() => selectCharacter(character.id)}>
                <span className="sociogram-node__portrait" aria-hidden="true">{character.portraitUrl ? <img src={character.portraitUrl} alt="" /> : character.initials}</span>
                <span className="sociogram-node__copy"><small>{character.people || "Personnage"}</small><strong>{character.displayName}</strong><span>{character.occupation || "Occupation non renseignée"}</span></span>
              </button>
            );
          })}
          <div className="sociogram-canvas__hint">{focusMode ? "Vue centrée sur le personnage sélectionné." : "Activez « Réseau entier » pour alterner avec une vue centrée."}</div>
        </section>

        <aside className="sociogram-inspector" aria-live="polite">
          <section className="sociogram-inspector__character">
            <div className="sociogram-inspector__portrait" aria-hidden="true">{selectedCharacter.portraitUrl ? <img src={selectedCharacter.portraitUrl} alt="" /> : selectedCharacter.initials}</div>
            <div><p className="panel__kicker">Personnage sélectionné</p><h2>{selectedCharacter.displayName}</h2><p>{selectedCharacter.epithet || "Personnage d’Imetheran"}</p></div>
            <Link className="text-link" href={`/personnages/${selectedCharacter.slug}`}>Voir la fiche <span aria-hidden="true">→</span></Link>
          </section>

          <section className="sociogram-inspector__relations">
            <div className="sociogram-inspector__heading"><p className="panel__kicker">Relations visibles</p><span>{characterRelations.length}</span></div>
            <div className="sociogram-relation-list">
              {characterRelations.length ? characterRelations.map((relationship) => {
                const counterpart = characters.find((character) => character.id === otherCharacterId(relationship, selectedCharacter.id));
                if (!counterpart) return null;
                return (
                  <button type="button" className={`sociogram-relation-item sociogram-relation-item--${relationship.kind}${selectedRelation?.id === relationship.id ? " is-active" : ""}`} key={relationship.id} onClick={() => setSelectedRelationId(relationship.id)}>
                    <span className="sociogram-relation-item__avatar" aria-hidden="true">{counterpart.portraitUrl ? <img src={counterpart.portraitUrl} alt="" /> : counterpart.initials}</span>
                    <span><small>{relationshipKinds[relationship.kind].label}</small><strong>{counterpart.displayName}</strong><span>{relationship.label}</span></span>
                  </button>
                );
              }) : <p className="sociogram-live-empty-copy">Aucune relation correspondant à ce filtre.</p>}
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

      {availableKinds.length ? (
        <div className="sociogram-legend" aria-label="Légende des types de relations">
          {availableKinds.map(([kind, meta]) => <span key={kind}><i className={`sociogram-legend__mark sociogram-legend__mark--${kind}`} />{meta.label}</span>)}
        </div>
      ) : null}
    </div>
  );
}
