"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthNav } from "@/components/auth-nav";

const links = [
  ["Accueil", "/"],
  ["Forum", "/forum"],
  ["Chroniques", "/chroniques"],
  ["Gazettes", "/gazettes"],
  ["Guides", "/guides"],
  ["Personnages", "/personnages"],
  ["Liens", "/liens"],
] as const;

function isCurrentPath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <>
      <a className="skip-link" href="#contenu-principal">Aller au contenu</a>
      <header className="topbar">
        <div className="topbar__inner content-frame">
          <Link className="topbar__brand" href="/" aria-label="Accueil Imetheran">
            <span aria-hidden="true">✦</span>
            <strong>Imetheran</strong>
          </Link>

          <nav className="main-nav" aria-label="Navigation principale">
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="main-nav__link"
                aria-current={isCurrentPath(pathname, href) ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="topbar__member">
            <span className="topbar__status">Communauté RP</span>
            <Link className="topbar__utility" href="/recherche" aria-label="Rechercher sur Imetheran">⌕ Recherche</Link>
            <AuthNav />
          </div>
        </div>
      </header>
      <span id="contenu-principal" className="skip-target" tabIndex={-1} />
    </>
  );
}
