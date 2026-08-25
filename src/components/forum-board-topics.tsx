"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type ForumTopicListItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  author: { name: string; initials: string };
  createdAt: string;
  lastActivity: string;
  lastActivityIso: string;
  replies: number;
  views: number;
  pinned: boolean;
  locked: boolean;
  status: string;
  tags: string[];
  lastAuthor: { name: string };
  lastPostId: string | null;
  unread: boolean;
};

type Filter = "all" | "unread" | "open" | "finished";
type Sort = "activity" | "replies" | "views";

const pageSize = 20;

export function ForumBoardTopics({ boardSlug, topics }: { boardSlug: string; topics: ForumTopicListItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("activity");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const pinned = topics.filter((topic) => topic.pinned);
  const regular = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("fr");

    return topics
      .filter((topic) => !topic.pinned)
      .filter((topic) => {
        if (filter === "unread" && !topic.unread) return false;
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
        return new Date(b.lastActivityIso).getTime() - new Date(a.lastActivityIso).getTime();
      });
  }, [filter, query, sort, topics]);

  useEffect(() => setPage(1), [filter, query, sort]);

  const pageCount = Math.max(1, Math.ceil(regular.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleRegular = regular.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
            {pinned.map((topic) => <TopicRow key={topic.id} boardSlug={boardSlug} topic={topic} />)}
          </div>
        </section>
      ) : null}

      <section className="forum-topic-group">
        <header>
          <span>Sujets</span>
          <small>{regular.length} sujet{regular.length > 1 ? "s" : ""}</small>
        </header>
        {visibleRegular.length > 0 ? (
          <div className="forum-topic-list">
            {visibleRegular.map((topic) => <TopicRow key={topic.id} boardSlug={boardSlug} topic={topic} />)}
          </div>
        ) : (
          <div className="forum-topic-browser__empty">
            <strong>{topics.length === 0 ? "Aucun sujet dans ce forum pour le moment." : "Aucun sujet ne correspond à ce filtre."}</strong>
            {topics.length > 0 ? (
              <button type="button" onClick={() => { setFilter("all"); setQuery(""); }}>Réinitialiser</button>
            ) : null}
          </div>
        )}
      </section>

      {pageCount > 1 ? (
        <div className="forum-pagination" aria-label="Pagination des sujets">
          <button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="Page précédente">←</button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              className={pageNumber === currentPage ? "is-current" : ""}
              type="button"
              onClick={() => setPage(pageNumber)}
              aria-current={pageNumber === currentPage ? "page" : undefined}
            >
              {pageNumber}
            </button>
          ))}
          <button type="button" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} aria-label="Page suivante">→</button>
        </div>
      ) : null}
    </div>
  );
}

function TopicRow({ boardSlug, topic }: { boardSlug: string; topic: ForumTopicListItem }) {
  const lastAnchor = topic.lastPostId ? `#${topic.lastPostId}` : "";

  return (
    <article className={`forum-topic-row${topic.pinned ? " forum-topic-row--pinned" : ""}${topic.unread ? " forum-topic-row--unread" : ""}`}>
      <span className="forum-topic-row__state" aria-hidden="true">{topic.locked ? "◆" : topic.unread ? "●" : topic.pinned ? "✦" : "◇"}</span>
      <div className="forum-topic-row__main">
        <div className="forum-topic-row__title">
          <Link href={`/forum/${boardSlug}/sujet/${topic.slug}`}>{topic.title}</Link>
          {topic.unread ? <span className="forum-topic-row__unread-badge">Nouveau</span> : null}
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
        <Link href={`/forum/${boardSlug}/sujet/${topic.slug}${lastAnchor}`}>{topic.lastAuthor.name}</Link>
        <strong>{topic.lastActivity}</strong>
      </div>
    </article>
  );
}
