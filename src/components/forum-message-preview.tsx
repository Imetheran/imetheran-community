import { BbcodeContent } from "@/components/bbcode-content";
import type { ForumMediaRenderMap } from "@/lib/forum-media";

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("fr") ?? "")
    .join("") || "M";
}

export function ForumMessagePreview({
  authorName,
  characterName,
  content,
  mediaMap,
  messageNumber,
  topicStarter = false,
  contextLabel = "Aperçu avant publication",
}: {
  authorName: string;
  characterName?: string | null;
  content: string;
  mediaMap?: ForumMediaRenderMap;
  messageNumber: number;
  topicStarter?: boolean;
  contextLabel?: string;
}) {
  return (
    <article className={`forum-post${topicStarter ? " forum-post--topic-author" : ""}`}>
      <aside className="forum-post__author">
        <div className="forum-post__avatar" aria-hidden="true">{initials(authorName)}</div>
        <strong>{authorName}</strong>
        <span className="forum-post__role">Membre</span>
        {topicStarter ? <span className="forum-post__starter">Auteur du sujet</span> : null}
        {characterName ? (
          <div className="forum-post__character">
            <small>Écrit avec</small>
            <span>{characterName}</span>
          </div>
        ) : null}
      </aside>

      <div className="forum-post__body">
        <header>
          <div>
            <span className="forum-post__number">#{messageNumber}</span>
            <time>À l’instant</time>
            <small>{contextLabel}</small>
          </div>
        </header>
        <div className="forum-post__content">
          <BbcodeContent content={content || "Votre message apparaîtra ici."} mediaMap={mediaMap} />
        </div>
      </div>
    </article>
  );
}
