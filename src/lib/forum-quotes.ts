const bbcodeTagPattern = /\[(?:\/?)(?:b|i|u|s|h2|h3|center|right|quote|code|spoiler|color|size|url)(?:=[^\]]*)?\]|\[hr\]/gi;
const imagePattern = /\[img=[0-9a-f-]{36}\][\s\S]*?\[\/img\]/gi;

export const FORUM_QUOTE_EVENT = "imetheran:forum-quote";

export function forumQuoteAuthor(value: string) {
  return value
    .replace(/[\[\]\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "Membre";
}

export function forumQuoteText(value: string, maxLength = 4000) {
  const text = value
    .replace(imagePattern, "[Image]")
    .replace(bbcodeTagPattern, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

export function forumQuoteBbcode(author: string, content: string) {
  return `[quote=${forumQuoteAuthor(author)}]${forumQuoteText(content)}[/quote]`;
}
