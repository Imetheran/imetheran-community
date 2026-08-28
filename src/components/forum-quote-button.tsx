"use client";

import { FORUM_QUOTE_EVENT, forumQuoteBbcode } from "@/lib/forum-quotes";

export function ForumQuoteButton({
  authorName,
  content,
}: {
  authorName: string;
  content: string;
}) {
  const quote = forumQuoteBbcode(authorName, content);

  return (
    <button
      type="button"
      aria-label={`Citer le message de ${authorName}`}
      onClick={() => {
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
