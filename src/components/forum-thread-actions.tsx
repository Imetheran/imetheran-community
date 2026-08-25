"use client";

import { useState, useTransition } from "react";
import { setTopicFollow } from "@/app/forum/actions";

export function ForumThreadActions({
  topicId,
  locked = false,
  authenticated,
  initialFollowing,
  loginHref,
}: {
  topicId: string;
  locked?: boolean;
  authenticated: boolean;
  initialFollowing: boolean;
  loginHref: string;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();

  function toggleFollow() {
    if (!authenticated || pending) return;
    const next = !following;
    startTransition(async () => {
      const result = await setTopicFollow(topicId, next);
      if (result.ok) {
        setFollowing(result.following);
        setNotice(result.following ? "Sujet ajouté à vos suivis." : "Sujet retiré de vos suivis.");
      } else {
        setNotice("Le suivi n’a pas pu être mis à jour.");
      }
    });
  }

  return (
    <div className="forum-thread-actions">
      {authenticated ? (
        <button
          className={`button button--ghost button--small${following ? " is-active" : ""}`}
          type="button"
          aria-pressed={following}
          disabled={pending}
          onClick={toggleFollow}
        >
          {pending ? "Mise à jour…" : following ? "Sujet suivi" : "Suivre le sujet"}
        </button>
      ) : (
        <a className="button button--ghost button--small" href={loginHref}>Se connecter pour suivre</a>
      )}
      {!locked ? (
        authenticated
          ? <a className="button button--primary button--small" href="#repondre">Répondre</a>
          : <a className="button button--primary button--small" href={loginHref}>Se connecter pour répondre</a>
      ) : null}
      <small>{notice || (authenticated ? "Le suivi est enregistré sur votre compte." : "Connexion requise pour les actions membre.")}</small>
    </div>
  );
}
