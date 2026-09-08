"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAppRole } from "@/lib/cms-access";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CMS_ROLES = new Set(["contributor", "editor"]);

async function requireAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims || typeof claims.sub !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fadministration%2Fredaction");
  }
  if (getAppRole(claims.app_metadata) !== "admin") redirect("/compte");
  return { supabase, userId: claims.sub };
}

export async function setCmsPermission(formData: FormData) {
  const targetUserId = String(formData.get("user_id") ?? "");
  const cmsRole = String(formData.get("cms_role") ?? "none");
  const canChronicles = formData.get("can_chronicles") === "on";
  const canGazettes = formData.get("can_gazettes") === "on";

  if (!UUID_PATTERN.test(targetUserId)) {
    redirect("/administration/redaction?erreur=donnees");
  }

  const { supabase, userId } = await requireAdmin();

  if (cmsRole === "none" || (!canChronicles && !canGazettes)) {
    const { error } = await supabase.from("cms_permissions").delete().eq("user_id", targetUserId);
    if (error) redirect("/administration/redaction?erreur=enregistrement");
  } else {
    if (!CMS_ROLES.has(cmsRole)) redirect("/administration/redaction?erreur=donnees");
    const { error } = await supabase.from("cms_permissions").upsert({
      user_id: targetUserId,
      cms_role: cmsRole,
      can_chronicles: canChronicles,
      can_gazettes: canGazettes,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (error) redirect("/administration/redaction?erreur=enregistrement");
  }

  revalidatePath("/administration/redaction");
  revalidatePath("/compte");
  revalidatePath("/redaction");
  redirect("/administration/redaction?message=enregistre");
}
