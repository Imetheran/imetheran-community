"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getRole(appMetadata: unknown) {
  if (!appMetadata || typeof appMetadata !== "object" || !("role" in appMetadata)) return "member";
  return String((appMetadata as { role?: unknown }).role ?? "member");
}

export async function setMaintenanceMode(formData: FormData) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (claimsError || !claims || getRole(claims.app_metadata) !== "admin") {
    redirect("/connexion?message=connexion-requise&retour=%2Fadministration");
  }

  const enabled = formData.get("enabled") === "true";
  const { error } = await supabase
    .from("site_runtime_settings")
    .update({
      maintenance_enabled: enabled,
      updated_at: new Date().toISOString(),
    })
    .eq("id", "main");

  if (error) {
    console.error("Unable to update maintenance mode", error);
    redirect("/administration?etat=erreur");
  }

  revalidatePath("/administration");
  revalidatePath("/maintenance");
  redirect(`/administration?etat=${enabled ? "maintenance" : "online"}`);
}
