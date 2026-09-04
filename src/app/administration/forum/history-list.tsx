import Link from "next/link";
import { actionLabel, eventDetails, formatDate } from "./utils";
import type { EventRow, ForumMaps } from "./types";
import styles from "./forum-admin.module.css";

export function HistoryList({ events, maps }: { events: EventRow[]; maps: ForumMaps }) {
  return (
    <section className={styles.panel} aria-label="Journal de modération">
      <div className={styles.timeline}>
        {events.length ? events.map((event) => {
          const topic = event.topic_id ? maps.topicMap.get(event.topic_id) : null;
          const board = topic ? maps.boardMap.get(topic.board_id) : null;
          const href = topic && board ? `/forum/${board.slug}/sujet/${topic.slug}${event.post_id ? `#${event.post_id}` : ""}` : null;

          return (
            <article key={event.id}>
              <span className={styles.timelineDot} aria-hidden="true" />
              <div>
                <strong>{actionLabel(event.action)}</strong>
                <p>{eventDetails(event, maps.boardMap)}</p>
                {href ? <Link href={href}>{topic?.title ?? "Voir le sujet"} →</Link> : null}
              </div>
              <div className={styles.timelineMeta}>
                <span>{maps.profileMap.get(event.actor_user_id ?? "") ?? "Système"}</span>
                <time dateTime={event.created_at}>{formatDate(event.created_at)}</time>
              </div>
            </article>
          );
        }) : <div className={styles.empty}><strong>Aucune action de modération enregistrée.</strong><p>Les nouvelles actions apparaîtront ici automatiquement.</p></div>}
      </div>
    </section>
  );
}
