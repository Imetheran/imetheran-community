"use client";

import { useMemo, useState } from "react";
import { createCharacterRelationship } from "@/app/liens/actions";
import { relationshipKinds, type RelationshipKind } from "@/content/relationship-content";

type RelationshipCharacterOption = {
  id: string;
  name: string;
  owned: boolean;
};

export function RelationshipProposalForm({
  ownCharacters,
  targetCharacters,
}: {
  ownCharacters: RelationshipCharacterOption[];
  targetCharacters: RelationshipCharacterOption[];
}) {
  const [sourceId, setSourceId] = useState(ownCharacters[0]?.id ?? "");
  const [targetId, setTargetId] = useState("");
  const availableTargets = useMemo(
    () => targetCharacters.filter((character) => character.id !== sourceId),
    [sourceId, targetCharacters],
  );

  function changeSource(nextSourceId: string) {
    setSourceId(nextSourceId);
    if (targetId === nextSourceId) setTargetId("");
  }

  return (
    <form className="relationship-form" action={createCharacterRelationship}>
      <label>
        <span>Mon personnage</span>
        <select name="source_character_id" required value={sourceId} onChange={(event) => changeSource(event.target.value)}>
          {ownCharacters.map((character) => <option value={character.id} key={character.id}>{character.name}</option>)}
        </select>
      </label>
      <label>
        <span>Personnage lié</span>
        <select name="target_character_id" required value={targetId} onChange={(event) => setTargetId(event.target.value)}>
          <option value="">Choisir…</option>
          {availableTargets.map((character) => (
            <option value={character.id} key={character.id}>{character.name}{character.owned ? " · le mien" : ""}</option>
          ))}
        </select>
        <small>Le personnage source ne peut pas être choisi comme cible.</small>
      </label>
      <label>
        <span>Type de relation</span>
        <select name="kind" defaultValue="trust">
          {(Object.entries(relationshipKinds) as Array<[RelationshipKind, { label: string }]>).map(([kind, meta]) => <option value={kind} key={kind}>{meta.label}</option>)}
        </select>
      </label>
      <label>
        <span>Intensité</span>
        <select name="intensity" defaultValue="1"><option value="1">●○○ · légère</option><option value="2">●●○ · marquée</option><option value="3">●●● · forte</option></select>
      </label>
      <label className="relationship-form__wide">
        <span>Intitulé</span>
        <input name="label" maxLength={120} required placeholder="Ex. Confiance prudente" />
      </label>
      <label className="relationship-form__wide">
        <span>Description partagée</span>
        <textarea name="description" rows={5} maxLength={3000} placeholder="Décrivez ce que les deux personnages partagent ou savent l’un de l’autre…" />
      </label>
      <label className="relationship-form__wide">
        <span>Visibilité après validation</span>
        <select name="visibility" defaultValue="public"><option value="public">Publique · visible sur le sociogramme</option><option value="unlisted">Non répertoriée · visible uniquement par lien direct</option><option value="private">Privée · propriétaires et équipe uniquement</option></select>
      </label>
      <div className="relationship-form__submit relationship-form__wide">
        <p>La relation ne devient visible publiquement qu’après les validations nécessaires.</p>
        <button className="button button--primary" type="submit" disabled={!sourceId || !targetId}>Envoyer la proposition</button>
      </div>
    </form>
  );
}
