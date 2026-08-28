"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createForumPost } from "@/app/forum/actions";
import { BbcodeEditor } from "@/components/bbcode-editor";
import { ForumMessagePreview } from "@/components/forum-message-preview";
import type { ForumMediaRenderMap } from "@/lib/forum-media";

type CharacterOption = {
  id: string;
  name: string;
};

function ReplyButton({ disabled = false }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="button button--primary button--small" type="submit" disabled={pending || disabled}>
      {pending ? "Publication…" : "Publier la réponse"}
    </button>
  );
}

export function ForumReplyEditor({
  boardSlug,
  topicSlug,
  topicId,
  memberName,
  nextMessageNumber,
  isRoleplay,
  characters,
}: {
  boardSlug: string;
  topicSlug: string;
  topicId: string;
  memberName: string;
  nextMessageNumber: number;
  isRoleplay: boolean;
  characters: CharacterOption[];
}) {
  const [content, setContent] = useState("");
  const [characterId, setCharacterId] = useState("");
  const [mediaMap, setMediaMap] = useState<ForumMediaRenderMap>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const selectedCharacter = characters.find((character) => character.id === characterId);
  const canPublish = content.trim().length >= 2;

  return (
    <form action={createForumPost}>
      <input type="hidden" name="board_slug" value={boardSlug} />
      <input type="hidden" name="topic_slug" value={topicSlug} />
      <input type="hidden" name="topic_id" value={topicId} />

      <div hidden={previewOpen}>
        <div className="forum-reply-box__identity">
          <span>Publier en tant que</span>
          {isRoleplay ? (
            <select name="character_id" value={characterId} onChange={(event) => setCharacterId(event.target.value)}>
              <option value="">Compte membre</option>
              {characters.map((character) => <option value={character.id} key={character.id}>{character.name}</option>)}
            </select>
          ) : <input type="hidden" name="character_id" value="" />}
          <small>Le compte reste toujours l’auteur ; dans un espace RP, vous pouvez signer le message avec l’un de vos personnages.</small>
        </div>

        <BbcodeEditor
          name="content"
          value={content}
          onChange={setContent}
          onMediaMapChange={setMediaMap}
          previewMode="none"
          ariaLabel="Contenu de la réponse"
          placeholder="Écrivez votre réponse…"
          rows={10}
          minLength={2}
          maxLength={50000}
          required
        />

        <div className="forum-reply-box__footer">
          <span>Vérifiez le rendu du message avant de le publier.</span>
          <div className="forum-reply-box__actions">
            <button className="button button--ghost button--small" type="button" onClick={() => setPreviewOpen(true)}>
              Prévisualiser le message
            </button>
            <ReplyButton />
          </div>
        </div>
      </div>

      {previewOpen ? (
        <div className="forum-reply-preview">
          <div className="forum-reply-preview__heading">
            <div>
              <p className="eyebrow">Avant publication</p>
              <h3>Prévisualisation de la réponse</h3>
            </div>
            <span className="status-pill">Non publiée</span>
          </div>

          <div className="forum-posts">
            <ForumMessagePreview
              authorName={memberName}
              characterName={selectedCharacter?.name}
              content={content.trim() || "Votre réponse apparaîtra ici."}
              mediaMap={mediaMap}
              messageNumber={nextMessageNumber}
            />
          </div>

          {!canPublish ? (
            <div className="forum-editor-notice forum-editor-notice--error" role="status">
              Écrivez au moins deux caractères avant de publier cette réponse.
            </div>
          ) : null}

          <div className="forum-reply-box__footer">
            <button className="button button--ghost button--small" type="button" onClick={() => setPreviewOpen(false)}>
              ← Revenir à l’édition
            </button>
            <ReplyButton disabled={!canPublish} />
          </div>
        </div>
      ) : null}
    </form>
  );
}
