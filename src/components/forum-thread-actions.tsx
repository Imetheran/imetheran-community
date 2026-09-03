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
  canParticipateInReplies,
  replyRequiresLogin,
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
  canParticipateInReplies: boolean;
  replyRequiresLogin: boolean;
  loginHref: string;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [currentLocked, setCurrentLocked] = useState(locked);
  const [currentPinned, setCurrentPinned] = useState(pinned);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  const followLoginHref = `/connexion?message=connexion-requise&retour=${encodeURIComponent(`/forum/${boardSlug}/sujet/${topicSlug}`)}`;

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
  const showReplyButton = repliesOpen && canParticipateInReplies;
  const showReplyLogin = repliesOpen && replyRequiresLogin;

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
          <a className="button button--ghost button--small" href={followLoginHref}>Se connecter pour suivre</a>
        )}
        {showReplyButton ? (
          <a className="button button--primary button--small" href="#repondre">Répondre</a>
        ) : showReplyLogin ? (
          <a className="button button--primary button--small" href={loginHref}>Se connecter pour répondre</a>
        ) : null}
      </div>

      {canModerate ? (
        <details className="forum-thread-actions__moderation">
          <summary className="button button--ghost button--small">Modération</summary>
          <div aria-label="Modération du sujet">
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
        </details>
      ) : null}

      <small>{notice || (authenticated ? "Suivez ce sujet pour retrouver plus facilement ses nouvelles réponses." : "Connectez-vous pour suivre ce sujet.")}</small>
    </div>
  );
}
