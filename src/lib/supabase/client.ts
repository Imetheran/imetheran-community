import { createBrowserClient } from "@supabase/ssr";
import { assertSupabaseConfig, supabasePublishableKey, supabaseUrl } from "./config";

export function createClient() {
  assertSupabaseConfig();
  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
