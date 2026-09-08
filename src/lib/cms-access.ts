import type { SupabaseClient } from "@supabase/supabase-js";

export type CmsRole = "contributor" | "editor";
export type CmsContentType = "chronicle" | "gazette";

export type CmsAccess = {
  appRole: string;
  isAdmin: boolean;
  cmsRole: CmsRole | null;
  canChronicles: boolean;
  canGazettes: boolean;
  canReview: boolean;
  hasAccess: boolean;
};

export function getAppRole(appMetadata: unknown) {
  if (!appMetadata || typeof appMetadata !== "object" || !("role" in appMetadata)) return "member";
  return String((appMetadata as { role?: unknown }).role ?? "member");
}

export async function getCmsAccess(
  supabase: SupabaseClient,
  userId: string,
  appMetadata: unknown,
): Promise<CmsAccess> {
  const appRole = getAppRole(appMetadata);
  const isAdmin = appRole === "admin";

  if (isAdmin) {
    return {
      appRole,
      isAdmin: true,
      cmsRole: "editor",
      canChronicles: true,
      canGazettes: true,
      canReview: true,
      hasAccess: true,
    };
  }

  const { data } = await supabase
    .from("cms_permissions")
    .select("cms_role, can_chronicles, can_gazettes")
    .eq("user_id", userId)
    .maybeSingle();

  const cmsRole = data?.cms_role === "editor" || data?.cms_role === "contributor"
    ? data.cms_role as CmsRole
    : null;
  const canChronicles = Boolean(data?.can_chronicles);
  const canGazettes = Boolean(data?.can_gazettes);

  return {
    appRole,
    isAdmin: false,
    cmsRole,
    canChronicles,
    canGazettes,
    canReview: cmsRole === "editor",
    hasAccess: Boolean(cmsRole && (canChronicles || canGazettes)),
  };
}

export function canAccessContent(access: CmsAccess, type: CmsContentType) {
  return access.isAdmin || (type === "chronicle" ? access.canChronicles : access.canGazettes);
}

export const cmsRoleLabels: Record<CmsRole, string> = {
  contributor: "Contributeur",
  editor: "Éditeur",
};
