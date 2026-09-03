"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type CharacterDirectoryItem = {
  id: string;
  slug: string;
  name: string;
  epithet: string;
  shortSummary: string;
  portrait: string | null;
  world: string;
  people: string;
  occupation: string;
  traits: string[];
  createdAt: string;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("fr") ?? "")
    .join("") || "IM";
}

function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr");
}

export function CharacterDirectoryBrowser({ characters }: { characters: CharacterDirectoryItem[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "name" | "world">("recent");

  const visibleCharacters = useMemo(() => {
    const needle = normalized(query.trim());
    const filtered = needle
      ? characters.filter((character) => {
          const haystack = normalized([
            character.name,
            character.epithet,
            character.shortSummary,
            character.people,
            character.world,
            character.occupation,
            ...character.traits,
          ].join(" "));
          return haystack.includes(needle);
        })
      : [...characters];

    filtered.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
      if (sort === "world") {
        const worldOrder = (a.world || "zzzz").localeCompare(b.world || "zzzz", "fr", { sensitivity: "base" });
        return worldOrder || a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return filtered;
  }, [characters, query, sort]);

  if (characters.length === 0) return null;

  return (
    <section className="character-browser" aria-labelledby="character-browser-title">
      <div className="character-browser__toolbar">
        <div className="character-browser__heading">
          <p className="eyebrow">Répertoire</p>
          <h2 id="character-browser-title">Parcourir les personnages</h2>
          <span>{visibleCharacters.length} résultat{visibleCharacters.length > 1 ? "s" : ""}</span>
        </div>
        <div className="character-browser__controls">
          <label>
            <span>Rechercher</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nom, peuple, métier, trait…"
              autoComplete="off"
            />
          </label>
          <label>
            <span>Trier</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
              <option value="recent">Plus récents</option>
              <option value="name">Nom A–Z</option>
              <option value="world">Monde</option>
            </select>
          </label>
        </div>
      </div>

      {visibleCharacters.length > 0 ? (
        <div className="character-grid">
          {visibleCharacters.map((character) => (
            <Link className="character-card" href={`/personnages/${character.slug}`} key={character.id}>
              <div className="character-card__portrait" aria-hidden="true">
                {character.portrait ? <img className="character-live-portrait" src={character.portrait} alt="" /> : <span>{initials(character.name)}</span>}
              </div>
              <div className="character-card__body">
                <small>{character.people || "Peuple non renseigné"} · {character.world || "Monde non renseigné"}</small>
                <h3>{character.name}</h3>
                <p className="character-card__epithet">{character.epithet || "Personnage rôleplay"}</p>
                <p>{character.shortSummary || "Aucun résumé renseigné pour le moment."}</p>
                <div className="character-card__tags">{character.traits.slice(0, 3).map((trait) => <span key={trait}>{trait}</span>)}</div>
              </div>
              <span className="character-card__arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="character-browser__empty">
          <strong>Aucun personnage ne correspond.</strong>
          <p>Essayez un nom, un monde, un peuple, un métier ou un trait différent.</p>
          <button type="button" onClick={() => setQuery("")}>Effacer la recherche</button>
        </div>
      )}
    </section>
  );
}
