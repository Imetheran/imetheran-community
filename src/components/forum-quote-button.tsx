"use client";

import { FORUM_QUOTE_EVENT, forumQuoteBbcode } from "@/lib/forum-quotes";

export function ForumQuoteButton({
  authorName,
  content,
}: {
  authorName: string;
  content: string;
}) {
  return (
    <button
      type="button"
      aria-label="Citer ce message"
      onClick={(event) => {
        const post = event.currentTarget.closest<HTMLElement>(".forum-post");
        const characterName = post
          ?.querySelector<HTMLElement>(".forum-post__identity-name")
          ?.textContent
          ?.trim();
        const quote = forumQuoteBbcode(characterName || authorName, content);

        window.dispatchEvent(new CustomEvent(FORUM_QUOTE_EVENT, { detail: { quote } }));
        requestAnimationFrame(() => {
          document.getElementById("repondre")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }}
    >
      Citer
    </button>
  );
}
