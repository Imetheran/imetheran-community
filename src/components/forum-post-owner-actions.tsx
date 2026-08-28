"use client";

import { useState } from "react";
import { deleteForumPost, deleteForumTopic, editForumPost } from "@/app/forum/actions";

type ForumPostOwnerActionsProps = {
  postId: string;
  topicId: string;
  boardSlug: string;
  topicSlug: string;
  content: string;
  canEdit: boolean;
  deleteKind: "post" | "topic" | null;
  isFirstPost: boolean;
};

export function ForumPostOwnerActions({
  postId,
  topicId,
  boardSlug,
  topicSlug,
  content,
  canEdit,
  deleteKind,
  isFirstPost,
}: ForumPostOwnerActionsProps) {
  const [editing, setEditing] = useState(false);
  const deleteAction = deleteKind === "topic" ? deleteForumTopic : deleteForumPost;
  const deleteLabel = deleteKind === "topic" ? "Supprimer le sujet" : "Supprimer";

  return (
    <div className="forum-post-owner">
      <div className="forum-post-owner__buttons">
        {canEdit ? (
          <button type="button" onClick={() => setEditing((value) => !value)} aria-expanded={editing}>
            {editing ? "Annuler" : "Modifier"}
          </button>
        ) : null}

        {deleteKind ? (
          <form
            action={deleteAction}
            onSubmit={(event) => {
              const message = deleteKind === "topic"
                ? "Supprimer définitivement ce sujet et son premier message ?"
                : "Supprimer définitivement ce message ?";
              if (!window.confirm(message)) event.preventDefault();
            }}
          >
            <input type="hidden" name="board_slug" value={boardSlug} />
            <input type="hidden" name="topic_slug" value={topicSlug} />
            <input type="hidden" name="topic_id" value={topicId} />
            <input type="hidden" name="post_id" value={postId} />
            <button className="forum-post-owner__delete" type="submit">{deleteLabel}</button>
          </form>
        ) : null}
      </div>

      {editing ? (
        <form className="forum-post-owner__editor" action={editForumPost}>
          <input type="hidden" name="board_slug" value={boardSlug} />
          <input type="hidden" name="topic_slug" value={topicSlug} />
          <input type="hidden" name="topic_id" value={topicId} />
          <input type="hidden" name="post_id" value={postId} />
          <label htmlFor={`edit-post-${postId}`}>Modifier votre message</label>
          <textarea id={`edit-post-${postId}`} name="content" defaultValue={content} rows={8} minLength={2} maxLength={50000} required />
          <div className="forum-post-owner__editor-footer">
            <small>{isFirstPost ? "Le résumé affiché dans la liste des sujets sera actualisé." : "La date de modification sera indiquée sur le message."}</small>
            <button className="button button--primary button--small" type="submit">Enregistrer</button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
