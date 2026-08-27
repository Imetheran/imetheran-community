export type GazettePublicationStatus = "draft" | "published" | "archived";
export type GazetteArticleKind = "lead" | "column" | "brief" | "recipe" | "quote" | "article";

export const gazettePublicationLabels: Record<GazettePublicationStatus, string> = {
  draft: "Brouillon",
  published: "Publiée",
  archived: "Archivée",
};

export const gazetteArticleLabels: Record<GazetteArticleKind, string> = {
  lead: "Article principal",
  column: "Colonne",
  brief: "Brève",
  recipe: "Recette / encadré",
  quote: "Citation / mot de la fin",
  article: "Article",
};

export function formatGazetteDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(new Date(value));
}

export function splitGazetteBody(value: string | null | undefined) {
  return String(value ?? "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function getAppRole(appMetadata: unknown) {
  if (!appMetadata || typeof appMetadata !== "object" || !("role" in appMetadata)) return "member";
  return String((appMetadata as { role?: unknown }).role ?? "member");
}
