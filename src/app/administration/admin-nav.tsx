"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./admin-nav.module.css";

type AdminNavProps = {
  isAdmin: boolean;
  isModerator: boolean;
};

export function AdminNav({ isAdmin, isModerator }: AdminNavProps) {
  const pathname = usePathname();

  const items = [
    ...(isAdmin ? [{ href: "/administration", label: "Tableau de bord" }] : []),
    { href: "/administration/forum", label: isModerator ? "Modération forum" : "Forum" },
    ...(isAdmin ? [
      { href: "/administration/forum/structure", label: "Structure" },
      { href: "/administration/membres", label: "Membres" },
      { href: "/administration/personnages", label: "Personnages" },
      { href: "/administration/liens", label: "Liens" },
      { href: "/administration/chroniques", label: "Chroniques" },
      { href: "/administration/gazettes", label: "Gazettes" },
    ] : []),
  ];

  return (
    <nav className={styles.nav} aria-label="Navigation administration">
      {items.map((item) => {
        const active = item.href === "/administration"
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? styles.active : undefined}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
      <span className={styles.separator} aria-hidden="true" />
      <Link href="/forum">Retour au site</Link>
    </nav>
  );
}
