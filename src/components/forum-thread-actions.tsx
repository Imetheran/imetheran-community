"use client";

import { useState } from "react";

export function ForumThreadActions({ locked = false }: { locked?: boolean }) {
  const [following, setFollowing] = useState(false);

  return (
    <div className="forum-thread-actions">
      <button
        className={`button button--ghost button--small${following ? " is-active" : ""}`}
        type="button"
        aria-pressed={following}
        onClick={() => setFollowing((value) => !value)}
      >
        {following ? "Sujet suivi" : "Suivre le sujet"}
      </button>
      {!locked ? <a className="button button--primary button--small" href="#repondre">Répondre</a> : null}
      <small>{following ? "Suivi localement pour la démonstration." : "Le suivi sera enregistré avec votre compte."}</small>
    </div>
  );
}
