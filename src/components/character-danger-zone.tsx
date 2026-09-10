"use client";

import { deleteCharacter, removeCharacterPortrait } from "@/app/personnages/danger-actions";

export function CharacterDangerZone({
  characterId,
  characterSlug,
  characterName,
  hasPortrait,
}: {
  characterId: string;
  characterSlug: string;
  characterName: string;
  hasPortrait: boolean;
}) {
  return (
    <section className="character-editor-danger-zone" aria-labelledby="character-danger-title">
      <div>
        <p className="eyebrow">Gestion</p>
        <h2 id="character-danger-title">Actions du personnage</h2>
      </div>

      {hasPortrait ? (
        <div className="character-editor-danger-row">
          <div>
            <strong>Portrait actuel</strong>
            <span>Retire l’image de la fiche sans supprimer le personnage.</span>
          </div>
          <form
            action={removeCharacterPortrait}
            onSubmit={(event) => {
              if (!window.confirm(`Supprimer le portrait actuel de ${characterName} ?`)) event.preventDefault();
            }}
          >
            <input type="hidden" name="character_id" value={characterId} />
            <input type="hidden" name="current_slug" value={characterSlug} />
            <button className="button button--ghost" type="submit">Supprimer le portrait</button>
          </form>
        </div>
      ) : null}

      <div className="character-editor-danger-row character-editor-danger-row--delete">
        <div>
          <strong>Supprimer le personnage</strong>
          <span>La fiche et ses relations seront supprimées. Les anciens messages du forum resteront publiés sans être associés au personnage.</span>
        </div>
        <form
          action={deleteCharacter}
          onSubmit={(event) => {
            if (!window.confirm(`Supprimer définitivement ${characterName} ? Cette action est irréversible.`)) event.preventDefault();
          }}
        >
          <input type="hidden" name="character_id" value={characterId} />
          <input type="hidden" name="current_slug" value={characterSlug} />
          <button className="button button--danger" type="submit">Supprimer définitivement</button>
        </form>
      </div>
    </section>
  );
}
