import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "./admin-nav";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

function getRole(appMetadata: unknown) {
  if (!appMetadata || typeof appMetadata !== "object" || !("role" in appMetadata)) return "member";
  return String((appMetadata as { role?: unknown }).role ?? "member");
}

export default async function AdministrationLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const role = getRole(claimsData?.claims?.app_metadata);
  const isAdmin = role === "admin";
  const isModerator = role === "moderator";

  return (
    <>
      {children}
      {isAdmin || isModerator ? <AdminNav isAdmin={isAdmin} isModerator={isModerator} /> : null}
    </>
  );
}
