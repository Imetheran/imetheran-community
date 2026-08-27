import type { BoardRow, EventRow, ViewName } from "./types";

export function roleFromMetadata(appMetadata: unknown) {
  if (!appMetadata || typeof appMetadata !== "object" || !("role" in appMetadata)) return "member";
  return String((appMetadata as { role?: unknown }).role ?? "member");
}

export function sectionOf(board: BoardRow | undefined) {
  if (!board?.forum_sections) return null;
  return Array.isArray(board.forum_sections) ? board.forum_sections[0] ?? null : board.forum_sections;
}

export function formatDate(value: string | null, withTime = true) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" as const } : {}),
    timeZone: "Europe/Paris",
  }).format(new Date(value));
}

export function statusLabel(value: string) {
  if (value === "in_review") return "En cours";
  if (value === "resolved") return "Résolu";
  if (value === "dismissed") return "Classé";
  if (value === "finished") return "Terminé";
  if (value === "archived") return "Archivé";
  if (value === "closed") return "Fermé";
  return "Ouvert";
}

export function reasonLabel(value: string) {
  if (value === "spam") return "Spam / publicité";
  if (value === "harassment") return "Harcèlement";
  if (value === "spoiler") return "Spoiler";
  if (value === "inappropriate") return "Contenu inapproprié";
  return "Autre";
}

export function actionLabel(value: string) {
  const labels: Record<string, string> = {
    move_topic: "Sujet déplacé",
    pin_topic: "Sujet épinglé",
    unpin_topic: "Sujet désépinglé",
    lock_topic: "Sujet verrouillé",
    unlock_topic: "Sujet déverrouillé",
    change_topic_status: "Statut du sujet modifié",
    hide_post: "Message masqué",
    restore_post: "Message restauré",
    change_report_status: "Signalement mis à jour",
  };
  return labels[value] ?? value;
}

export function eventDetails(event: EventRow, boardMap: Map<string, BoardRow>) {
  const fromBoardId = typeof event.details.from_board_id === "string" ? event.details.from_board_id : null;
  const toBoardId = typeof event.details.to_board_id === "string" ? event.details.to_board_id : null;
  if (fromBoardId || toBoardId) return `${boardMap.get(fromBoardId ?? "")?.title ?? "Forum inconnu"} → ${boardMap.get(toBoardId ?? "")?.title ?? "Forum inconnu"}`;

  const fromStatus = typeof event.details.from_status === "string" ? statusLabel(event.details.from_status) : null;
  const toStatus = typeof event.details.to_status === "string" ? statusLabel(event.details.to_status) : null;
  return fromStatus || toStatus ? `${fromStatus ?? "—"} → ${toStatus ?? "—"}` : "Action enregistrée dans le journal de modération.";
}

export function buildReturnTo(view: ViewName, status: string, board: string, q: string) {
  const params = new URLSearchParams();
  params.set("vue", view);
  if (status) params.set("statut", status);
  if (board) params.set("forum", board);
  if (q) params.set("q", q);
  return `/administration/forum?${params.toString()}`;
}
