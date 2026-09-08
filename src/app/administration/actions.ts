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
  const requestedReturnTo = String(formData.get("return_to") ?? "");
  const returnTo = requestedReturnTo === "/administration/site" ? "/administration/site" : "/administration";
  const { data, error } = await supabase
    .from("site_runtime_settings")
    .update({
      maintenance_enabled: enabled,
      updated_at: new Date().toISOString(),
    })
    .eq("id", "main")
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error("Unable to update maintenance mode", error);
    redirect(`${returnTo}?etat=erreur`);
  }

  revalidatePath("/");
  revalidatePath("/administration");
  revalidatePath("/administration/site");
  revalidatePath("/maintenance");
  redirect(`${returnTo}?etat=${enabled ? "maintenance" : "online"}`);
}
