export type ChronicleNarrativeStatus = "upcoming" | "open" | "closed";
export type ChroniclePublicationStatus = "draft" | "published" | "archived";
export type ChronicleChapterStatus = "completed" | "active" | "upcoming";

export const chronicleNarrativeLabels: Record<ChronicleNarrativeStatus, string> = {
  upcoming: "À venir",
  open: "Ouverte",
  closed: "Terminée",
};

export const chroniclePublicationLabels: Record<ChroniclePublicationStatus, string> = {
  draft: "Brouillon",
  published: "Publiée",
  archived: "Archivée",
};

export const chronicleChapterLabels: Record<ChronicleChapterStatus, string> = {
  completed: "Terminé",
  active: "En cours",
  upcoming: "À venir",
};

export function formatChronicleDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(new Date(value));
}

export function splitChronicleBody(value: string | null | undefined) {
  return String(value ?? "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function getAppRole(appMetadata: unknown) {
  if (!appMetadata || typeof appMetadata !== "object" || !("role" in appMetadata)) return "member";
  return String((appMetadata as { role?: unknown }).role ?? "member");
}
