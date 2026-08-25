"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { characters } from "@/content/character-content";
import {
  characterRelationships,
  relationshipKinds,
  type CharacterRelationship,
  type RelationshipKind,
} from "@/content/relationship-content";

const graphPositions: Record<string, { x: number; y: number }> = {
  "aelys-vardane": { x: 50, y: 24 },
  "rhydan-sorel": { x: 25, y: 72 },
  "nahla-rahn": { x: 75, y: 72 },
};

type FilterKind = "all" | RelationshipKind;

function otherSlug(relationship: CharacterRelationship, selectedSlug: string) {
  return relationship.sourceSlug === selectedSlug
    ? relationship.targetSlug
    : relationship.sourceSlug;
}

export function Sociogram() {
  const [selectedSlug, setSelectedSlug] = useState("aelys-vardane");
  const [selectedRelationId, setSelectedRelationId] = useState<string | null>("aelys-rhydan");
  const [filter, setFilter] = useState<FilterKind>("all");

  const selectedCharacter = characters.find((character) => character.slug === selectedSlug) ?? characters[0];
  const selectedRelation = characterRelationships.find((relationship) => relationship.id === selectedRelationId) ?? null;

  const visibleRelationships = useMemo(
    () => characterRelationships.filter((relationship) => filter === "all" || relationship.kind === filter),
    [filter],
  );

  const characterRelations = characterRelationships.filter(
    (relationship) => relationship.sourceSlug === selectedSlug || relationship.targetSlug === selectedSlug,
  );

  return (
    <div className="sociogram-workspace">
      <div className="sociogram-toolbar">
        <div>
          <span className="sociogram-toolbar__label">Afficher</span>
          <div className="sociogram-filters" role="group" aria-label="Filtrer les relations">
            <button className={filter === "all" ? "is-active" : ""} type="button" onClick={() => setFilter("all")}>Toutes</button>
            {(Object.entries(relationshipKinds) as Array<[RelationshipKind, { label: string; shortLabel: string }]>).map(([kind, meta]) => (
              <button
                className={filter === kind ? "is-active" : ""}
                type="button"
                key={kind}
                onClick={() => setFilter(kind)}
              >
                {meta.shortLabel}
              </button>
            ))}
          </div>
        </div>
        <div className="sociogram-toolbar__meta">
          <span><strong>{characters.length}</strong> personnages</span>
          <span><strong>{characterRelationships.length}</strong> relations</span>
        </div>
      </div>

      <div className="sociogram-layout">
        <section className="sociogram-canvas" aria-label="Carte interactive des relations">
          <div className="sociogram-canvas__grid" aria-hidden="true" />
          <svg className="sociogram-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {visibleRelationships.map((relationship) => {
              const source = graphPositions[relationship.sourceSlug];
              const target = graphPositions[relationship.targetSlug];
              const isFocused = selectedRelationId === relationship.id || relationship.sourceSlug === selectedSlug || relationship.targetSlug === selectedSlug;

              return (
                <line
                  key={relationship.id}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  className={`sociogram-line sociogram-line--${relationship.kind}${isFocused ? " is-focused" : ""}`}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>

          {visibleRelationships.map((relationship) => {
            const source = graphPositions[relationship.sourceSlug];
            const target = graphPositions[relationship.targetSlug];
            const x = (source.x + target.x) / 2;
            const y = (source.y + target.y) / 2;
            const isSelected = selectedRelationId === relationship.id;

            return (
              <button
                className={`sociogram-edge-label sociogram-edge-label--${relationship.kind}${isSelected ? " is-selected" : ""}`}
                style={{ left: `${x}%`, top: `${y}%` }}
                type="button"
                key={relationship.id}
                onClick={() => {
                  setSelectedRelationId(relationship.id);
                  setSelectedSlug(relationship.sourceSlug);
                }}
              >
                {relationshipKinds[relationship.kind].shortLabel}
              </button>
            );
          })}

          {characters.map((character) => {
            const position = graphPositions[character.slug];
            const isSelected = selectedSlug === character.slug;
            const connected = characterRelationships.some(
              (relationship) => relationship.sourceSlug === character.slug || relationship.targetSlug === character.slug,
            );

            return (
              <button
                key={character.id}
                className={`sociogram-node${isSelected ? " is-selected" : ""}${connected ? " is-connected" : ""}`}
                style={{ left: `${position.x}%`, top: `${position.y}%` }}
                type="button"
                onClick={() => {
                  setSelectedSlug(character.slug);
                  const firstRelation = characterRelationships.find(
                    (relationship) => relationship.sourceSlug === character.slug || relationship.targetSlug === character.slug,
                  );
                  setSelectedRelationId(firstRelation?.id ?? null);
                }}
              >
                <span className="sociogram-node__portrait" aria-hidden="true">{character.initials}</span>
                <span className="sociogram-node__copy">
                  <small>{character.people}</small>
                  <strong>{character.displayName}</strong>
                  <span>{character.occupation}</span>
                </span>
              </button>
            );
          })}

          <div className="sociogram-canvas__hint">Sélectionnez un personnage ou une relation</div>
        </section>

        <aside className="sociogram-inspector" aria-live="polite">
          <section className="sociogram-inspector__character">
            <div className="sociogram-inspector__portrait" aria-hidden="true">{selectedCharacter.initials}</div>
            <div>
              <p className="panel__kicker">Personnage sélectionné</p>
              <h2>{selectedCharacter.displayName}</h2>
              <p>{selectedCharacter.epithet}</p>
            </div>
            <Link className="text-link" href={`/personnages/${selectedCharacter.slug}`}>Voir la fiche <span aria-hidden="true">→</span></Link>
          </section>

          <section className="sociogram-inspector__relations">
            <div className="sociogram-inspector__heading">
              <p className="panel__kicker">Relations connues</p>
              <span>{characterRelations.length}</span>
            </div>
            <div className="sociogram-relation-list">
              {characterRelations.map((relationship) => {
                const counterpartSlug = otherSlug(relationship, selectedSlug);
                const counterpart = characters.find((character) => character.slug === counterpartSlug);
                const isActive = selectedRelationId === relationship.id;

                if (!counterpart) return null;

                return (
                  <button
                    type="button"
                    className={`sociogram-relation-item sociogram-relation-item--${relationship.kind}${isActive ? " is-active" : ""}`}
                    key={relationship.id}
                    onClick={() => setSelectedRelationId(relationship.id)}
                  >
                    <span className="sociogram-relation-item__avatar">{counterpart.initials}</span>
                    <span>
                      <small>{relationshipKinds[relationship.kind].label}</small>
                      <strong>{counterpart.displayName}</strong>
                      <span>{relationship.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {selectedRelation ? (
            <section className={`sociogram-inspector__detail sociogram-inspector__detail--${selectedRelation.kind}`}>
              <div className="sociogram-inspector__heading">
                <p className="panel__kicker">Lien sélectionné</p>
                <span>{"●".repeat(selectedRelation.intensity)}{"○".repeat(3 - selectedRelation.intensity)}</span>
              </div>
              <h3>{selectedRelation.label}</h3>
              <p>{selectedRelation.description}</p>
              <div className="sociogram-inspector__detail-meta">
                <span>{relationshipKinds[selectedRelation.kind].label}</span>
                <span>{selectedRelation.reciprocal ? "Relation réciproque" : "Perception unilatérale"}</span>
              </div>
            </section>
          ) : null}
        </aside>
      </div>

      <div className="sociogram-legend" aria-label="Légende des types de relations">
        {(Object.entries(relationshipKinds) as Array<[RelationshipKind, { label: string; shortLabel: string }]>).map(([kind, meta]) => (
          <span key={kind}><i className={`sociogram-legend__mark sociogram-legend__mark--${kind}`} />{meta.label}</span>
        ))}
      </div>
    </div>
  );
}
