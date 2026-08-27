export type RelationshipKind =
  | "trust"
  | "friendship"
  | "rivalry"
  | "debt"
  | "family"
  | "romance"
  | "unknown";

export const relationshipKinds: Record<RelationshipKind, { label: string; shortLabel: string }> = {
  trust: { label: "Confiance", shortLabel: "Confiance" },
  friendship: { label: "Amitié", shortLabel: "Amitié" },
  rivalry: { label: "Rivalité", shortLabel: "Rivalité" },
  debt: { label: "Dette", shortLabel: "Dette" },
  family: { label: "Famille", shortLabel: "Famille" },
  romance: { label: "Sentiment", shortLabel: "Sentiment" },
  unknown: { label: "Lien incertain", shortLabel: "Incertain" },
};
