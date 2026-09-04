import Link from "next/link";
import { ConfirmDeleteButton } from "../confirm-delete-button";
import destructiveStyles from "../destructive-actions.module.css";
import { moderateTopicFromAdmin, moveTopicFromAdmin } from "./actions";
import { deleteForumTopicFromAdmin } from "./delete-actions";
import { formatDate, sectionOf, statusLabel } from "./utils";
import type { ForumMaps, TopicRow } from "./types";
import styles from "./forum-admin.module.css";

export function TopicList({ topics, maps, returnTo, canDelete }: { topics: TopicRow[]; maps: ForumMaps; returnTo: string; canDelete: boolean }) {
  return (
    <section className={styles.panel} aria-label="Sujets">
      <div className={styles.rows}>
        {topics.length ? topics.map((topic) => {
          const board = maps.boardMap.get(topic.board_id);
          const section = sectionOf(board);
          const href = board ? `/forum/${board.slug}/sujet/${topic.slug}` : "/forum";
          const destinations = maps.boards.filter((candidate) => candidate.is_active && sectionOf(candidate)?.mode === section?.mode);
          const author = topic.author_id ? maps.profileMap.get(topic.author_id) ?? "Membre" : "Compte supprimé";

          return (
            <article className={styles.row} key={topic.id}>
              <div className={styles.rowMain}>
                <div className={styles.badges}>
                  <span>{statusLabel(topic.status)}</span>
                  {topic.is_pinned ? <span>Épinglé</span> : null}
                  {topic.is_locked ? <span>Verrouillé</span> : null}
                </div>
                <Link href={href}><strong>{topic.title}</strong></Link>
                <small>{board?.title ?? "Forum"} · {author} · {topic.post_count} message{topic.post_count > 1 ? "s" : ""}</small>
                <time dateTime={topic.last_activity_at}>Dernière activité · {formatDate(topic.last_activity_at)}</time>
              </div>

              <div className={styles.rowActions}>
                <div className={styles.actionGroup}>
                  <small>État du sujet</small>
                  <form action={moderateTopicFromAdmin}>
                    <input type="hidden" name="topic_id" value={topic.id} />
                    <input type="hidden" name="return_to" value={returnTo} />
                    <button name="action" value={topic.is_pinned ? "unpin" : "pin"} type="submit">{topic.is_pinned ? "Désépingler" : "Épingler"}</button>
                    <button name="action" value={topic.is_locked ? "unlock" : "lock"} type="submit">{topic.is_locked ? "Déverrouiller" : "Verrouiller"}</button>
                    {topic.status === "open" ? (
                      <><button name="action" value="finish" type="submit">Terminer</button><button name="action" value="archive" type="submit">Archiver</button></>
                    ) : <button name="action" value="reopen" type="submit">Rouvrir</button>}
                  </form>
                </div>

                <div className={styles.actionGroup}>
                  <small>Déplacement</small>
                  <form action={moveTopicFromAdmin}>
                    <input type="hidden" name="topic_id" value={topic.id} />
                    <input type="hidden" name="return_to" value={returnTo} />
                    <select name="board_id" defaultValue={topic.board_id} aria-label="Déplacer vers un forum">
                      {destinations.map((candidate) => <option value={candidate.id} key={candidate.id}>{candidate.title}</option>)}
                    </select>
                    <button type="submit">Déplacer</button>
                  </form>
                </div>

                {canDelete ? (
                  <div className={`${styles.actionGroup} ${styles.dangerGroup}`}>
                    <small>Zone destructive</small>
                    <form action={deleteForumTopicFromAdmin}>
                      <input type="hidden" name="topic_id" value={topic.id} />
                      <input type="hidden" name="return_to" value={returnTo} />
                      <ConfirmDeleteButton
                        className={destructiveStyles.dangerButton}
                        label="Supprimer le sujet"
                        confirmMessage={`Supprimer définitivement « ${topic.title} » ?\n\nLes ${topic.post_count} message${topic.post_count > 1 ? "s" : ""}, signalements, suivis, lectures et médias joints seront également supprimés. Les éventuels actes de chronique liés perdront seulement leur lien vers ce sujet. Cette action est irréversible.`}
                      />
                    </form>
                  </div>
                ) : null}
              </div>
            </article>
          );
        }) : <div className={styles.empty}><strong>Aucun sujet ne correspond aux filtres.</strong><p>Modifiez la recherche ou réinitialisez les filtres.</p></div>}
      </div>
    </section>
  );
}
