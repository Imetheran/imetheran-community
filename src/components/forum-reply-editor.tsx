"use client";

import { useFormStatus } from "react-dom";
import { createForumPost } from "@/app/forum/actions";
import { BbcodeEditor } from "@/components/bbcode-editor";

type CharacterOption = {
  id: string;
  name: string;
};

function ReplyButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button button--primary button--small" type="submit" disabled={pending}>
      {pending ? "Publication…" : "Publier la réponse"}
    </button>
  );
}

export function ForumReplyEditor({
  boardSlug,
  topicSlug,
  topicId,
  isRoleplay,
  characters,
}: {
  boardSlug: string;
  topicSlug: string;
  topicId: string;
  isRoleplay: boolean;
  characters: CharacterOption[];
}) {
  return (
    <form action={createForumPost}>
      <input type="hidden" name="board_slug" value={boardSlug} />
      <input type="hidden" name="topic_slug" value={topicSlug} />
      <input type="hidden" name="topic_id" value={topicId} />

      <div className="forum-reply-box__identity">
        <span>Publier en tant que</span>
        {isRoleplay ? (
          <select name="character_id" defaultValue="">
            <option value="">Compte membre</option>
            {characters.map((character) => <option value={character.id} key={character.id}>{character.name}</option>)}
          </select>
        ) : <input type="hidden" name="character_id" value="" />}
        <small>Le compte reste toujours l’auteur ; dans un espace RP, vous pouvez signer le message avec l’un de vos personnages.</small>
      </div>

      <BbcodeEditor
        name="content"
        ariaLabel="Contenu de la réponse"
        placeholder="Écrivez votre réponse…"
        rows={10}
        minLength={2}
        maxLength={50000}
        required
      />

      <div className="forum-reply-box__footer">
        <span>Utilisez le BBCode et l’aperçu pour préparer votre mise en page avant publication.</span>
        <ReplyButton />
      </div>
    </form>
  );
}
