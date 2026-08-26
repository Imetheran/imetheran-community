import Link from "next/link";
import styles from "./admin-nav.module.css";

export default function AdministrationLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <nav className={styles.nav} aria-label="Navigation administration">
        <Link href="/administration">Tableau de bord</Link>
        <Link href="/administration/membres">Membres</Link>
      </nav>
    </>
  );
}
