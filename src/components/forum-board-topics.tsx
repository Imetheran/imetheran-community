"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ForumTopic } from "@/content/forum-demo-content";

type Filter = "all" | "unread" | "open" | "finished";
type Sort = "activity" | "replies" | "views";

const demoUnreadTopicIds = new Set(["topic-lanternes", "topic-storyline-demo"]);

export function ForumBoardTopics({ boardSlug, topics }: { boardSlug: string; topics: ForumTopic[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("activity");
  const [query, setQuery] = useState("");

  const pinned = topics.filter((topic) => topic.pinned);
  const regular = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("fr");

    return topics
      .filter((topic) => !topic.pinned)
      .filter((topic) => {
        if (filter === "unread" && !demoUnreadTopicIds.has(topic.id)) return false;
        if (filter === "open" && topic.status !== "open") return false;
        if (filter === "finished" && topic.status !== "finished") return false;
        if (!normalizedQuery) return true;

        return [topic.title, topic.excerpt, ...topic.tags]
          .join(" ")
          .toLocaleLowerCase("fr")
          .includes(normalizedQuery);
      })
      .sort((a, b) => {
        if (sort === "replies") return b.replies - a.replies;
        if (sort === "views") return b.views - a.views;
        return topics.indexOf(a) - topics.indexOf(b);
      });
  }, [filter, query, sort, topics]);

  return (
    <div className="forum-topic-browser">
      <div className="forum-topic-browser__controls" aria-label="Filtrer les sujets">
        <div className="forum-topic-browser__filters">
          {([
            ["all", "Tous"],
            ["unread", "Non lus"],
            ["open", "Ouverts"],
            ["finished", "Terminés"],
          ] as const).map(([value, label]) => (
            <button
              className={filter === value ? "is-active" : ""}
              key={value}
              onClick={() => setFilter(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="forum-topic-browser__tools">
          <label className="forum-topic-browser__search">
            <span className="sr-only">Rechercher dans ce forum</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un sujet…"
            />
          </label>
          <label className="forum-topic-browser__sort">
            <span>Trier</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
              <option value="activity">Activité récente</option>
              <option value="replies">Plus de réponses</option>
              <option value="views">Plus vus</option>
            </select>
          </label>
        </div>
      </div>

      {pinned.length > 0 ? (
        <section className="forum-topic-group">
          <header><span>Épinglés</span><small>{pinned.length} sujet{pinned.length > 1 ? "s" : ""}</small></header>
          <div className="forum-topic-list">
            {pinned.map((topic) => <TopicRow key={topic.id} boardSlug={boardSlug} topic={topic} unread={false} />)}
          </div>
        </section>
      ) : null}

      <section className="forum-topic-group">
        <header>
          <span>Sujets</span>
          <small>{regular.length} affiché{regular.length > 1 ? "s" : ""}</small>
        </header>
        {regular.length > 0 ? (
          <div className="forum-topic-list">
            {regular.map((topic) => (
              <TopicRow key={topic.id} boardSlug={boardSlug} topic={topic} unread={demoUnreadTopicIds.has(topic.id)} />
            ))}
          </div>
        ) : (
          <div className="forum-topic-browser__empty">
            <strong>Aucun sujet ne correspond à ce filtre.</strong>
            <button type="button" onClick={() => { setFilter("all"); setQuery(""); }}>Réinitialiser</button>
          </div>
        )}
      </section>

      <div className="forum-pagination" aria-label="Pagination des sujets">
        <button type="button" disabled aria-label="Page précédente">←</button>
        <span className="is-current">1</span>
        <span>2</span>
        <span>3</span>
        <button type="button" disabled aria-label="Page suivante">→</button>
        <small>Pagination de démonstration</small>
      </div>
    </div>
  );
}

function TopicRow({ boardSlug, topic, unread }: { boardSlug: string; topic: ForumTopic; unread: boolean }) {
  const lastPost = topic.posts.at(-1);
  const lastAuthor = lastPost?.author ?? topic.author;
  const lastAnchor = lastPost ? `#${lastPost.id}` : "";

  return (
    <article className={`forum-topic-row${topic.pinned ? " forum-topic-row--pinned" : ""}${unread ? " forum-topic-row--unread" : ""}`}>
      <span className="forum-topic-row__state" aria-hidden="true">{topic.locked ? "◆" : unread ? "●" : topic.pinned ? "✦" : "◇"}</span>
      <div className="forum-topic-row__main">
        <div className="forum-topic-row__title">
          <Link href={`/forum/${boardSlug}/sujet/${topic.slug}`}>{topic.title}</Link>
          {unread ? <span className="forum-topic-row__unread-badge">Nouveau</span> : null}
          {topic.pinned ? <span>Épinglé</span> : null}
          {topic.locked ? <span>Verrouillé</span> : null}
          {topic.status === "finished" ? <span>Terminé</span> : null}
        </div>
        <p>{topic.excerpt}</p>
        <div className="forum-topic-row__tags">{topic.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      </div>
      <div className="forum-topic-row__author">
        <span>{topic.author.initials}</span>
        <div><small>Ouvert par</small><strong>{topic.author.name}</strong><em>{topic.createdAt}</em></div>
      </div>
      <div className="forum-topic-row__numbers">
        <span><strong>{topic.replies}</strong><small>Réponses</small></span>
        <span><strong>{topic.views}</strong><small>Vues</small></span>
      </div>
      <div className="forum-topic-row__last">
        <small>Dernier message</small>
        <Link href={`/forum/${boardSlug}/sujet/${topic.slug}${lastAnchor}`}>{lastAuthor.name}</Link>
        <strong>{topic.lastActivity}</strong>
      </div>
    </article>
  );
}
