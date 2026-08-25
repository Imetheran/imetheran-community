export type RelationshipKind =
  | "trust"
  | "friendship"
  | "rivalry"
  | "debt"
  | "family"
  | "romance"
  | "unknown";

export type CharacterRelationship = {
  id: string;
  sourceSlug: string;
  targetSlug: string;
  kind: RelationshipKind;
  label: string;
  description: string;
  intensity: 1 | 2 | 3;
  reciprocal: boolean;
};

export const relationshipKinds: Record<RelationshipKind, { label: string; shortLabel: string }> = {
  trust: { label: "Confiance", shortLabel: "Confiance" },
  friendship: { label: "Amitié", shortLabel: "Amitié" },
  rivalry: { label: "Rivalité", shortLabel: "Rivalité" },
  debt: { label: "Dette", shortLabel: "Dette" },
  family: { label: "Famille", shortLabel: "Famille" },
  romance: { label: "Sentiment", shortLabel: "Sentiment" },
  unknown: { label: "Lien incertain", shortLabel: "Incertain" },
};

export const characterRelationships: CharacterRelationship[] = [
  {
    id: "aelys-rhydan",
    sourceSlug: "aelys-vardane",
    targetSlug: "rhydan-sorel",
    kind: "trust",
    label: "Confiance prudente",
    description:
      "Ils ont déjà partagé plusieurs routes. Aelys fait confiance au jugement de Rhydan, mais garde pour elle les raisons qui l'ont poussée à le consulter la première fois.",
    intensity: 2,
    reciprocal: true,
  },
  {
    id: "aelys-nahla",
    sourceSlug: "aelys-vardane",
    targetSlug: "nahla-rahn",
    kind: "debt",
    label: "Une histoire contre une dette",
    description:
      "Nahla connaît un détail sur une ancienne carte d'Aelys. Personne ne semble tout à fait d'accord sur ce qui a réellement été promis en échange.",
    intensity: 2,
    reciprocal: false,
  },
  {
    id: "rhydan-nahla",
    sourceSlug: "rhydan-sorel",
    targetSlug: "nahla-rahn",
    kind: "rivalry",
    label: "Désaccord familier",
    description:
      "Ils se contredisent souvent et coopèrent presque aussi souvent. Leur rivalité tient davantage de l'habitude que d'une véritable hostilité.",
    intensity: 1,
    reciprocal: true,
  },
];

export function getRelationshipsForCharacter(slug: string) {
  return characterRelationships.filter(
    (relationship) => relationship.sourceSlug === slug || relationship.targetSlug === slug,
  );
}
