"use client";

import Link from "next/link";
import { reportForumContent } from "@/app/forum/report-actions";
import styles from "./forum-report-control.module.css";

const REASONS = [
  ["spam", "Spam ou publicité"],
  ["harassment", "Harcèlement / attaque personnelle"],
  ["inappropriate", "Contenu inapproprié"],
  ["spoiler", "Spoiler non signalé"],
  ["other", "Autre"],
] as const;

export function ForumReportControl({
  topicId,
  postId,
  boardSlug,
  topicSlug,
  authenticated,
  loginHref,
}: {
  topicId: string;
  postId: string;
  boardSlug: string;
  topicSlug: string;
  authenticated: boolean;
  loginHref: string;
}) {
  const exactLoginHref = postId
    ? `/connexion?message=connexion-requise&retour=${encodeURIComponent(`/forum/${boardSlug}/sujet/${topicSlug}#${postId}`)}`
    : loginHref;

  if (!authenticated) {
    return <Link className={styles.loginLink} href={exactLoginHref}>Signaler</Link>;
  }

  return (
    <details className={styles.control}>
      <summary>Signaler</summary>
      <form className={styles.form} action={reportForumContent}>
        <input type="hidden" name="board_slug" value={boardSlug} />
        <input type="hidden" name="topic_slug" value={topicSlug} />
        <input type="hidden" name="topic_id" value={topicId} />
        <input type="hidden" name="post_id" value={postId} />

        <label>
          <span>Motif</span>
          <select name="reason" defaultValue="inappropriate" required>
            {REASONS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>

        <label>
          <span>Précisions</span>
          <textarea
            name="details"
            rows={4}
            maxLength={2000}
            placeholder="Expliquez brièvement ce qui doit être vérifié par l’équipe."
          />
        </label>

        <div className={styles.footer}>
          <small>Le signalement est visible uniquement par l’équipe.</small>
          <div className={styles.actions}>
            <button
              className="button button--ghost button--small"
              type="button"
              onClick={(event) => {
                const details = event.currentTarget.closest("details");
                if (details) details.open = false;
              }}
            >
              Annuler
            </button>
            <button className="button button--primary button--small" type="submit">Envoyer</button>
          </div>
        </div>
      </form>
    </details>
  );
}
