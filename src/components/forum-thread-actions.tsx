"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { moderateForumTopic, setTopicFollow } from "@/app/forum/actions";

type TopicStatus = "open" | "finished" | "archived" | string;
type ModerationAction = "pin" | "unpin" | "lock" | "unlock" | "finish" | "archive" | "reopen";

export function ForumThreadActions({
  topicId,
  boardSlug,
  topicSlug,
  locked = false,
  pinned = false,
  status = "open",
  authenticated,
  initialFollowing,
  canModerate = false,
  loginHref,
}: {
  topicId: string;
  boardSlug: string;
  topicSlug: string;
  locked?: boolean;
  pinned?: boolean;
  status?: TopicStatus;
  authenticated: boolean;
  initialFollowing: boolean;
  canModerate?: boolean;
  loginHref: string;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [currentLocked, setCurrentLocked] = useState(locked);
  const [currentPinned, setCurrentPinned] = useState(pinned);
  const [currentStatus, setCurrentStatus] = useState(status);
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

  function moderate(action: ModerationAction) {
    if (!canModerate || pending) return;
    startTransition(async () => {
      const result = await moderateForumTopic(topicId, boardSlug, topicSlug, action);
      if (!result.ok) {
        setNotice("La modération n’a pas pu être appliquée.");
        return;
      }

      setCurrentPinned(result.pinned);
      setCurrentLocked(result.locked);
      setCurrentStatus(result.status);
      setNotice("Modification de modération enregistrée.");
      router.refresh();
    });
  }

  const repliesOpen = currentStatus === "open" && !currentLocked;

  return (
    <div className="forum-thread-actions">
      <div className="forum-thread-actions__primary">
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
        {repliesOpen ? (
          authenticated
            ? <a className="button button--primary button--small" href="#repondre">Répondre</a>
            : <a className="button button--primary button--small" href={loginHref}>Se connecter pour répondre</a>
        ) : null}
      </div>

      {canModerate ? (
        <div className="forum-thread-actions__moderation" aria-label="Modération du sujet">
          <button className="button button--ghost button--small" type="button" disabled={pending} onClick={() => moderate(currentPinned ? "unpin" : "pin")}>
            {currentPinned ? "Désépingler" : "Épingler"}
          </button>
          <button className="button button--ghost button--small" type="button" disabled={pending} onClick={() => moderate(currentLocked ? "unlock" : "lock")}>
            {currentLocked ? "Déverrouiller" : "Verrouiller"}
          </button>
          {currentStatus === "open" ? (
            <>
              <button className="button button--ghost button--small" type="button" disabled={pending} onClick={() => moderate("finish")}>Terminer</button>
              <button className="button button--ghost button--small" type="button" disabled={pending} onClick={() => moderate("archive")}>Archiver</button>
            </>
          ) : (
            <>
              <button className="button button--ghost button--small" type="button" disabled={pending} onClick={() => moderate("reopen")}>Rouvrir</button>
              {currentStatus === "finished" ? <button className="button button--ghost button--small" type="button" disabled={pending} onClick={() => moderate("archive")}>Archiver</button> : null}
            </>
          )}
        </div>
      ) : null}

      <small>{notice || (authenticated ? "Le suivi est enregistré sur votre compte." : "Connexion requise pour les actions membre.")}</small>
    </div>
  );
}
