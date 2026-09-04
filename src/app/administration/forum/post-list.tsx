import Link from "next/link";
import { ConfirmDeleteButton } from "../confirm-delete-button";
import destructiveStyles from "../destructive-actions.module.css";
import { setPostVisibilityFromAdmin } from "./actions";
import { deleteForumPostFromAdmin } from "./delete-actions";
import { formatDate } from "./utils";
import type { ForumMaps, PostRow } from "./types";
import styles from "./forum-admin.module.css";

export function PostList({ posts, maps, returnTo, canDelete }: { posts: PostRow[]; maps: ForumMaps; returnTo: string; canDelete: boolean }) {
  return (
    <section className={styles.panel} aria-labelledby="posts-title">
      <header className={styles.panelHead}>
        <div><p className="eyebrow">Contenu</p><h2 id="posts-title">Messages</h2></div>
        <span>{posts.length} affiché{posts.length > 1 ? "s" : ""}</span>
      </header>

      <div className={styles.rows}>
        {posts.length ? posts.map((post) => {
          const topic = maps.topicMap.get(post.topic_id);
          const board = topic ? maps.boardMap.get(topic.board_id) : null;
          const href = topic && board ? `/forum/${board.slug}/sujet/${topic.slug}#${post.id}` : "/forum";
          const author = post.author_id ? maps.profileMap.get(post.author_id) ?? "Membre" : "Compte supprimé";
          const isLastPost = (topic?.post_count ?? 0) <= 1;

          return (
            <article className={`${styles.row} ${post.is_hidden ? styles.rowHidden : ""}`} key={post.id}>
              <div className={styles.rowMain}>
                <div className={styles.badges}><span>{post.is_hidden ? "Masqué" : "Visible"}</span></div>
                <Link href={href}><strong>{topic?.title ?? "Sujet indisponible"}</strong></Link>
                <p className={styles.excerpt}>{post.content.slice(0, 360)}{post.content.length > 360 ? "…" : ""}</p>
                <small>{author} · {formatDate(post.created_at)}{post.hidden_at ? ` · masqué ${formatDate(post.hidden_at)}` : ""}</small>
              </div>

              <div className={styles.rowActions}>
                <div className={styles.actionGroup}>
                  <small>{post.is_hidden ? "Modération active" : "Visibilité"}</small>
                  <form className={styles.visibilityAction} action={setPostVisibilityFromAdmin}>
                    <input type="hidden" name="post_id" value={post.id} />
                    <input type="hidden" name="hidden" value={post.is_hidden ? "false" : "true"} />
                    <input type="hidden" name="return_to" value={returnTo} />
                    <button className={post.is_hidden ? "button button--primary button--small" : "button button--ghost button--small"} type="submit">{post.is_hidden ? "Restaurer" : "Masquer"}</button>
                  </form>
                </div>

                {canDelete ? (
                  <div className={styles.actionGroup}>
                    <small>Suppression définitive</small>
                    {isLastPost ? (
                      <span>Dernier message du sujet : supprimez le sujet entier depuis l’onglet Sujets.</span>
                    ) : (
                      <form action={deleteForumPostFromAdmin}>
                        <input type="hidden" name="post_id" value={post.id} />
                        <input type="hidden" name="return_to" value={returnTo} />
                        <ConfirmDeleteButton
                          className={destructiveStyles.dangerButton}
                          label="Supprimer le message"
                          confirmMessage={`Supprimer définitivement ce message de « ${topic?.title ?? "ce sujet"} » ?\n\nLe message, ses signalements et ses médias joints seront supprimés de la base et du stockage. Cette action est irréversible.`}
                        />
                      </form>
                    )}
                  </div>
                ) : null}
              </div>
            </article>
          );
        }) : <div className={styles.empty}><strong>Aucun message ne correspond aux filtres.</strong></div>}
      </div>
    </section>
  );
}
