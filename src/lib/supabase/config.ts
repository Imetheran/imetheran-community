const fallbackUrl = "https://grbbliiayrcrulqnwvxc.supabase.co";
const fallbackPublishableKey = "sb_publishable_JDZqmfa1_sqVHXKzhxnqBw_RxEDKSf2";

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? fallbackUrl;
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? fallbackPublishableKey;

export function assertSupabaseConfig() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Configuration Supabase manquante.");
  }
}
