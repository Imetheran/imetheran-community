export type ForumMemberRole = "member" | "moderator" | "admin" | string;
export type ForumWritePolicy = "members" | "staff" | "closed" | string;

export function isForumStaff(role: ForumMemberRole) {
  return role === "admin" || role === "moderator";
}

export function canUseForumWritePolicy(
  policy: ForumWritePolicy,
  userId: string | null,
  role: ForumMemberRole,
  canParticipate: boolean,
) {
  if (!userId || !canParticipate) return false;
  if (policy === "members") return true;
  if (policy === "staff") return isForumStaff(role);
  return false;
}

export function forumWriteRestrictionLabel(
  policy: ForumWritePolicy,
  role: ForumMemberRole,
  canParticipate: boolean,
) {
  if (!canParticipate) return "Participation suspendue";
  if (policy === "closed") return "Publication fermée";
  if (policy === "staff" && !isForumStaff(role)) return "Publication réservée à l’équipe";
  return null;
}
