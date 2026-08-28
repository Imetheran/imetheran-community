export const FORUM_MEDIA_BUCKET = "forum-media";
export const FORUM_MEDIA_MAX_BYTES = 5 * 1024 * 1024;
export const FORUM_MEDIA_MAX_PER_POST = 8;

const mediaIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const imageTagPattern = /\[img=([^\]]+)\][\s\S]*?\[\/img\]/gi;

export type ForumMediaRenderItem = {
  url: string;
  width: number;
  height: number;
};

export type ForumMediaRenderMap = Record<string, ForumMediaRenderItem>;

export function isForumMediaId(value: string) {
  return mediaIdPattern.test(value.trim());
}

export function extractForumMediaIds(content: string) {
  const ids = new Set<string>();
  let match: RegExpExecArray | null;
  imageTagPattern.lastIndex = 0;
  while ((match = imageTagPattern.exec(content))) {
    const id = String(match[1] ?? "").trim();
    if (isForumMediaId(id)) ids.add(id.toLowerCase());
  }
  return Array.from(ids);
}

export function forumMediaExtension(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return null;
  }
}
