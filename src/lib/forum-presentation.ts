const topicTypeLabels: Record<string, string> = {
  open: "Scène ouverte",
  targeted: "Scène ciblée",
  storyline: "Scénario",
  event: "Événement",
  discussion: "Discussion",
  question: "Question",
  share: "Partage",
};

export function forumTopicTypeLabel(value: string | null | undefined) {
  if (!value) return null;
  return topicTypeLabels[value] ?? "Sujet";
}
