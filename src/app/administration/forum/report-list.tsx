import Link from "next/link";
import { setPostVisibilityFromAdmin, updateReportFromAdmin } from "./actions";
import { formatDate, reasonLabel, statusLabel } from "./utils";
import type { ForumMaps, ReportRow } from "./types";
import styles from "./forum-admin.module.css";

export function ReportList({ reports, maps, returnTo }: { reports: ReportRow[]; maps: ForumMaps; returnTo: string }) {
  return (
    <section className={styles.panel} aria-labelledby="reports-title">
      <header className={styles.panelHead}>
        <div><p className="eyebrow">File active</p><h2 id="reports-title">Signalements</h2></div>
        <span>{reports.length} affiché{reports.length > 1 ? "s" : ""}</span>
      </header>

      <div className={styles.cards}>
        {reports.length ? reports.map((report) => {
          const topic = maps.topicMap.get(report.topic_id);
          const board = topic ? maps.boardMap.get(topic.board_id) : null;
          const linkedPost = report.post_id ? maps.postMap.get(report.post_id) : null;
          const href = topic && board ? `/forum/${board.slug}/sujet/${topic.slug}${report.post_id ? `#${report.post_id}` : ""}` : "/forum";

          return (
            <article className={styles.reportCard} key={report.id}>
              <header>
                <div className={styles.badges}><span>{statusLabel(report.status)}</span><span>{reasonLabel(report.reason)}</span></div>
                <time dateTime={report.created_at}>{formatDate(report.created_at)}</time>
              </header>
              <h3>{topic?.title ?? "Sujet indisponible"}</h3>
              <p>{report.details || "Aucune précision supplémentaire fournie."}</p>
              <div className={styles.meta}>
                <span>Signalé par <strong>{maps.profileMap.get(report.reporter_id) ?? "Membre"}</strong></span>
                {report.handled_by ? <span>Pris en charge par <strong>{maps.profileMap.get(report.handled_by) ?? "Équipe"}</strong></span> : null}
                <Link href={href}>Ouvrir le contenu →</Link>
              </div>

              <form className={styles.reportResolution} action={updateReportFromAdmin}>
                <input type="hidden" name="report_id" value={report.id} />
                <input type="hidden" name="return_to" value={returnTo} />
                <select name="status" defaultValue={report.status} aria-label="Statut du signalement">
                  <option value="open">Ouvert</option>
                  <option value="in_review">En cours</option>
                  <option value="resolved">Résolu</option>
                  <option value="dismissed">Classé sans suite</option>
                </select>
                <input name="resolution_note" maxLength={2000} defaultValue={report.resolution_note} placeholder="Note de résolution (interne)" />
                <button className="button button--primary button--small" type="submit">Enregistrer</button>
              </form>

              {linkedPost ? (
                <form className={styles.inlineAction} action={setPostVisibilityFromAdmin}>
                  <input type="hidden" name="post_id" value={linkedPost.id} />
                  <input type="hidden" name="hidden" value={linkedPost.is_hidden ? "false" : "true"} />
                  <input type="hidden" name="return_to" value={returnTo} />
                  <button className="button button--ghost button--small" type="submit">{linkedPost.is_hidden ? "Restaurer le message lié" : "Masquer le message lié"}</button>
                </form>
              ) : null}
            </article>
          );
        }) : <div className={styles.empty}><strong>Aucun signalement dans cette vue.</strong><p>Les nouveaux signalements membres apparaîtront ici automatiquement.</p></div>}
      </div>
    </section>
  );
}
