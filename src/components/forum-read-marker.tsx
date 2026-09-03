"use client";

import { useEffect } from "react";
import { markTopicRead } from "@/app/forum/actions";
import { createClient } from "@/lib/supabase/client";

const CHARACTER_PORTRAIT_BUCKET = "character-portraits";
const CHARACTER_PORTRAIT_TTL = 60 * 60;

type CharacterIdentity = {
  slug: string;
  name: string;
  portrait_path: string | null;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("fr") ?? "")
    .join("") || "IM";
}

function characterSlug(link: HTMLAnchorElement) {
  const href = link.getAttribute("href") ?? "";
  return href.split("/").filter(Boolean).at(-1) ?? "";
}

async function enhanceForumCharacterIdentities() {
  const characterLinks = Array.from(
    document.querySelectorAll<HTMLAnchorElement>(".forum-post__character[href^='/personnages/']"),
  );
  if (characterLinks.length === 0) return;

  const slugs = Array.from(new Set(characterLinks.map(characterSlug).filter(Boolean)));
  if (slugs.length === 0) return;

  const supabase = createClient();
  const { data: characters, error } = await supabase
    .from("characters")
    .select("slug, name, portrait_path")
    .in("slug", slugs);
  if (error || !characters?.length) return;

  const characterMap = new Map(
    characters.map((character) => [character.slug, character as CharacterIdentity]),
  );
  const portraitPaths = Array.from(
    new Set(
      characters
        .map((character) => character.portrait_path)
        .filter((path): path is string => typeof path === "string" && path.length > 0),
    ),
  );

  const signedByPath = new Map<string, string>();
  if (portraitPaths.length > 0) {
    const { data: signedRows } = await supabase.storage
      .from(CHARACTER_PORTRAIT_BUCKET)
      .createSignedUrls(portraitPaths, CHARACTER_PORTRAIT_TTL);

    for (const item of signedRows ?? []) {
      if (item.path && item.signedUrl) signedByPath.set(item.path, item.signedUrl);
    }
  }

  for (const characterLink of characterLinks) {
    const character = characterMap.get(characterSlug(characterLink));
    const author = characterLink.closest<HTMLElement>(".forum-post__author");
    if (!character || !author || author.dataset.characterIdentity === "true") continue;

    const memberNameElement = author.querySelector<HTMLElement>(":scope > strong");
    const avatar = author.querySelector<HTMLElement>(".forum-post__avatar");
    if (!memberNameElement || !avatar) continue;

    const memberName = memberNameElement.textContent?.trim() || "Membre";
    const profileLink = document.createElement("a");
    profileLink.className = "forum-post__identity-name";
    profileLink.href = characterLink.href;
    profileLink.textContent = character.name;
    profileLink.setAttribute("aria-label", `Voir la fiche de ${character.name}`);
    memberNameElement.replaceWith(profileLink);

    const player = document.createElement("span");
    player.className = "forum-post__player";
    player.textContent = `Joué par ${memberName}`;
    characterLink.replaceWith(player);

    avatar.classList.add("forum-post__avatar--character");
    const portraitUrl = character.portrait_path
      ? signedByPath.get(character.portrait_path)
      : null;

    if (portraitUrl) {
      const image = document.createElement("img");
      image.src = portraitUrl;
      image.alt = "";
      image.loading = "lazy";
      image.decoding = "async";
      avatar.replaceChildren(image);
    } else {
      avatar.textContent = initials(character.name);
    }

    author.dataset.characterIdentity = "true";
  }
}

export function ForumReadMarker({ topicId, lastPostId }: { topicId: string; lastPostId: string | null }) {
  useEffect(() => {
    void markTopicRead(topicId, lastPostId);
    void enhanceForumCharacterIdentities();
  }, [topicId, lastPostId]);

  return null;
}
