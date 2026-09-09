"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { moderateForumTopic, setTopicFollow } from "@/app/forum/actions";
import { createClient } from "@/lib/supabase/client";

type TopicStatus = "open" | "finished" | "archived" | string;
type ModerationAction = "pin" | "unpin" | "lock" | "unlock" | "finish" | "archive" | "reopen";
type LinkedEvent = {
  slug: string;
  title: string;
  startsAt: string;
  status: string;
  chronicle: { slug: string; title: string } | null;
};

const trackedTopicViews = new Set<string>();

function formatEventDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(new Date(value));
}

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
  const [linkedEvent, setLinkedEvent] = useState<LinkedEvent | null>(null);
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  const followLoginHref = `/connexion?message=connexion-requise&retour=${encodeURIComponent(`/forum/${boardSlug}/sujet/${topicSlug}`)}`;

  useEffect(() => {
    const storageKey = `imetheran:forum:view:${topicId}`;
    if (trackedTopicViews.has(topicId)) return;

    try {
      if (window.sessionStorage.getItem(storageKey)) {
        trackedTopicViews.add(topicId);
        return;
      }
      window.sessionStorage.setItem(storageKey, "pending");
    } catch {
      // The in-memory set still prevents duplicate calls during this page lifetime.
    }

    trackedTopicViews.add(topicId);
    let active = true;

    async function trackView() {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("increment_forum_topic_view", {
        p_topic_id: topicId,
      });

      if (error || data === null) {
        trackedTopicViews.delete(topicId);
        try {
          window.sessionStorage.removeItem(storageKey);
        } catch {}
        return;
      }

      try {
        window.sessionStorage.setItem(storageKey, "counted");
      } catch {}

      if (active) router.refresh();
    }

    void trackView();
    return () => {
      active = false;
    };
  }, [router, topicId]);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function loadLinkedEvent() {
      const { data: event } = await supabase
        .from("community_events")
        .select("slug, title, starts_at, status, related_chronicle_id")
        .eq("related_topic_id", topicId)
        .order("starts_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!active || !event) return;

      let chronicle: LinkedEvent["chronicle"] = null;
      if (event.related_chronicle_id) {
        const { data } = await supabase
          .from("chronicles")
          .select("slug, title")
          .eq("id", event.related_chronicle_id)
          .maybeSingle();
        if (data) chronicle = { slug: data.slug, title: data.title };
      }

      if (active) {
        setLinkedEvent({
          slug: event.slug,
          title: event.title,
          startsAt: event.starts_at,
          status: event.status,
          chronicle,
        });
      }
    }

    void loadLinkedEvent();
    return () => { active = false; };
  }, [topicId]);

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
      {linkedEvent ? (
        <div className="forum-thread-context">
          <a href={`/evenements/${linkedEvent.slug}`}>
            <span>Événement · {linkedEvent.status === "cancelled" ? "Annulé" : linkedEvent.status === "finished" ? "Terminé" : formatEventDate(linkedEvent.startsAt)}</span>
            <strong>{linkedEvent.title}</strong>
          </a>
          {linkedEvent.chronicle ? <a href={`/chroniques/${linkedEvent.chronicle.slug}`}>Chronique · {linkedEvent.chronicle.title}</a> : null}
        </div>
      ) : null}

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

      {notice ? <small>{notice}</small> : null}
    </div>
  );
}
