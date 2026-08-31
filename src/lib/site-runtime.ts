import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";

export type SiteRuntimeSettings = {
  maintenanceEnabled: boolean;
  updatedAt: string | null;
  source: "database" | "fallback";
};

function fallbackSettings(): SiteRuntimeSettings {
  return {
    maintenanceEnabled: process.env.MAINTENANCE_MODE?.toLowerCase() === "true",
    updatedAt: null,
    source: "fallback",
  };
}

export async function readSiteRuntimeSettings(): Promise<SiteRuntimeSettings> {
  try {
    const supabase = createSupabaseClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data, error } = await supabase
      .from("site_runtime_settings")
      .select("maintenance_enabled, updated_at")
      .eq("id", "main")
      .maybeSingle();

    if (error || !data) return fallbackSettings();

    return {
      maintenanceEnabled: Boolean(data.maintenance_enabled),
      updatedAt: typeof data.updated_at === "string" ? data.updated_at : null,
      source: "database",
    };
  } catch {
    return fallbackSettings();
  }
}
