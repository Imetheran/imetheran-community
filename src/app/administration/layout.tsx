import type { Metadata } from "next";
import Link from "next/link";
import styles from "./admin-nav.module.css";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdministrationLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <nav className={styles.nav} aria-label="Navigation administration">
        <Link href="/administration">Tableau de bord</Link>
        <Link href="/administration/forum">Forum</Link>
        <Link href="/administration/forum/structure">Structure</Link>
        <Link href="/administration/membres">Membres</Link>
        <Link href="/administration/personnages">Personnages</Link>
        <Link href="/administration/liens">Liens</Link>
        <Link href="/administration/chroniques">Chroniques</Link>
        <Link href="/administration/gazettes">Gazettes</Link>
      </nav>
    </>
  );
}
