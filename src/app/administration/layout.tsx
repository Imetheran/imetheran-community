import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import styles from "./admin-nav.module.css";

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
      {isAdmin || isModerator ? (
        <nav className={styles.nav} aria-label="Navigation administration">
          {isAdmin ? <Link href="/administration">Tableau de bord</Link> : null}
          <Link href="/administration/forum">{isModerator ? "Modération forum" : "Forum"}</Link>
          {isAdmin ? <Link href="/administration/forum/structure">Structure</Link> : null}
          {isAdmin ? <Link href="/administration/membres">Membres</Link> : null}
          {isAdmin ? <Link href="/administration/personnages">Personnages</Link> : null}
          {isAdmin ? <Link href="/administration/liens">Liens</Link> : null}
          {isAdmin ? <Link href="/administration/chroniques">Chroniques</Link> : null}
          {isAdmin ? <Link href="/administration/gazettes">Gazettes</Link> : null}
          {isModerator ? <Link href="/forum">Retour au forum</Link> : null}
        </nav>
      ) : null}
    </>
  );
}
