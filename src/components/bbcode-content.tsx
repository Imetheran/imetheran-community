import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { isForumMediaId, type ForumMediaRenderMap } from "@/lib/forum-media";

type BbcodeTextNode = {
  type: "text";
  value: string;
};

type BbcodeTagNode = {
  type: "tag";
  name: string;
  attr: string | null;
  children: BbcodeNode[];
};

type BbcodeNode = BbcodeTextNode | BbcodeTagNode;

const supportedTags = new Set([
  "b",
  "i",
  "u",
  "s",
  "h2",
  "h3",
  "center",
  "right",
  "quote",
  "code",
  "spoiler",
  "color",
  "size",
  "url",
  "img",
  "hr",
]);

function cleanAttribute(value: string | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function parseBbcode(input: string): BbcodeNode[] {
  const root: BbcodeNode[] = [];
  const stack: { name: string; children: BbcodeNode[] }[] = [{ name: "root", children: root }];
  const tokenPattern = /\[(\/?)((?:[a-z][a-z0-9]*))(?:=([^\]]*))?\]/gi;
  let cursor = 0;
  let match: RegExpExecArray | null;

  const appendText = (value: string) => {
    if (!value) return;
    stack.at(-1)?.children.push({ type: "text", value });
  };

  while ((match = tokenPattern.exec(input))) {
    appendText(input.slice(cursor, match.index));

    const [token, closingMarker, rawName, rawAttr] = match;
    const name = rawName.toLowerCase();
    const closing = closingMarker === "/";

    if (!supportedTags.has(name)) {
      appendText(token);
      cursor = tokenPattern.lastIndex;
      continue;
    }

    if (name === "hr" && !closing) {
      stack.at(-1)?.children.push({ type: "tag", name, attr: null, children: [] });
      cursor = tokenPattern.lastIndex;
      continue;
    }

    if (closing) {
      const current = stack.at(-1);
      if (current && current.name === name) {
        stack.pop();
      } else {
        appendText(token);
      }
      cursor = tokenPattern.lastIndex;
      continue;
    }

    if (name === "code") {
      const closeToken = "[/code]";
      const closeIndex = input.toLowerCase().indexOf(closeToken, tokenPattern.lastIndex);
      if (closeIndex >= 0) {
        stack.at(-1)?.children.push({
          type: "tag",
          name,
          attr: cleanAttribute(rawAttr),
          children: [{ type: "text", value: input.slice(tokenPattern.lastIndex, closeIndex) }],
        });
        tokenPattern.lastIndex = closeIndex + closeToken.length;
        cursor = tokenPattern.lastIndex;
        continue;
      }
    }

    const node: BbcodeTagNode = {
      type: "tag",
      name,
      attr: cleanAttribute(rawAttr),
      children: [],
    };
    stack.at(-1)?.children.push(node);
    stack.push({ name, children: node.children });
    cursor = tokenPattern.lastIndex;
  }

  appendText(input.slice(cursor));
  return root;
}

function textContent(nodes: BbcodeNode[]): string {
  return nodes.map((node) => node.type === "text" ? node.value : textContent(node.children)).join("");
}

function safeHref(value: string | null) {
  if (!value) return null;
  const href = value.trim();
  if (href.startsWith("/") && !href.startsWith("//")) return href;

  try {
    const parsed = new URL(href);
    if (["http:", "https:", "mailto:"].includes(parsed.protocol)) return parsed.toString();
  } catch {
    return null;
  }
  return null;
}

function safeColor(value: string | null) {
  if (!value) return null;
  const color = value.trim();
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color) ? color : null;
}

function safeSize(value: string | null) {
  if (!value || !/^\d{2,3}$/.test(value.trim())) return null;
  const size = Number(value);
  return size >= 70 && size <= 200 ? size : null;
}

function renderNodes(nodes: BbcodeNode[], mediaMap: ForumMediaRenderMap, path = "bb"): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${path}-${index}`;
    if (node.type === "text") return <span key={key}>{node.value}</span>;

    const children = renderNodes(node.children, mediaMap, key);
    switch (node.name) {
      case "b":
        return <strong key={key}>{children}</strong>;
      case "i":
        return <em key={key}>{children}</em>;
      case "u":
        return <u key={key}>{children}</u>;
      case "s":
        return <s key={key}>{children}</s>;
      case "h2":
        return <span className="bbcode-heading bbcode-heading--2" role="heading" aria-level={2} key={key}>{children}</span>;
      case "h3":
        return <span className="bbcode-heading bbcode-heading--3" role="heading" aria-level={3} key={key}>{children}</span>;
      case "center":
        return <div className="bbcode-align bbcode-align--center" key={key}>{children}</div>;
      case "right":
        return <div className="bbcode-align bbcode-align--right" key={key}>{children}</div>;
      case "quote":
        return (
          <blockquote className="bbcode-quote" key={key}>
            {node.attr ? <cite>{node.attr}</cite> : null}
            <div>{children}</div>
          </blockquote>
        );
      case "code":
        return <pre className="bbcode-code" key={key}><code>{textContent(node.children)}</code></pre>;
      case "spoiler":
        return (
          <details className="bbcode-spoiler" key={key}>
            <summary>{node.attr || "Afficher le spoiler"}</summary>
            <div>{children}</div>
          </details>
        );
      case "color": {
        const color = safeColor(node.attr);
        return color ? <span style={{ color }} key={key}>{children}</span> : <span key={key}>{children}</span>;
      }
      case "size": {
        const size = safeSize(node.attr);
        const style: CSSProperties | undefined = size ? { fontSize: `${size}%` } : undefined;
        return <span style={style} key={key}>{children}</span>;
      }
      case "url": {
        const href = safeHref(node.attr || textContent(node.children));
        if (!href) return <span key={key}>{children}</span>;
        const external = /^https?:/i.test(href);
        return (
          <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer nofollow ugc" : undefined} key={key}>
            {node.children.length ? children : href}
          </a>
        );
      }
      case "img": {
        const mediaId = node.attr?.trim().toLowerCase() ?? "";
        const media = isForumMediaId(mediaId) ? mediaMap[mediaId] : undefined;
        const alt = textContent(node.children).replace(/\s+/g, " ").trim().slice(0, 180) || "Image du message";
        if (!media) {
          return <span className="bbcode-image-unavailable" key={key}>[Image indisponible]</span>;
        }
        return (
          <span className="bbcode-image" key={key}>
            <Image
              src={media.url}
              alt={alt}
              width={media.width}
              height={media.height}
              sizes="(max-width: 760px) 100vw, 900px"
            />
          </span>
        );
      }
      case "hr":
        return <hr key={key} />;
      default:
        return <span key={key}>{children}</span>;
    }
  });
}

export function BbcodeContent({
  content,
  className = "",
  mediaMap = {},
}: {
  content: string;
  className?: string;
  mediaMap?: ForumMediaRenderMap;
}) {
  const classes = ["bbcode-content", className].filter(Boolean).join(" ");
  return <div className={classes}>{renderNodes(parseBbcode(content), mediaMap)}</div>;
}
