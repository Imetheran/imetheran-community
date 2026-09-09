"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthNav } from "@/components/auth-nav";

const primaryLinks = [
  ["Accueil", "/"],
  ["Forum", "/forum"],
  ["Événements", "/evenements"],
  ["Chroniques", "/chroniques"],
  ["Personnages", "/personnages"],
] as const;

const moreLinks = [
  ["Gazettes", "/gazettes"],
  ["Guides", "/guides"],
  ["Membres", "/membres"],
  ["Liens", "/liens"],
] as const;

function isCurrentPath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const moreIsCurrent = moreLinks.some(([, href]) => isCurrentPath(pathname, href));

  return (
    <>
      <a className="skip-link" href="#contenu-principal">Aller au contenu</a>
      <header className="topbar">
        <div className="topbar__inner content-frame">
          <Link className="topbar__brand" href="/" aria-label="Accueil Imetheran">
            <span className="topbar__brand-mark" aria-hidden="true">✦</span>
            <span className="topbar__brand-copy">
              <strong>Imetheran</strong>
              <small>Communauté RP · Moogle</small>
            </span>
          </Link>

          <nav className="main-nav" aria-label="Navigation principale">
            {primaryLinks.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className={`main-nav__link${href === "/" ? " main-nav__home" : ""}`}
                aria-current={isCurrentPath(pathname, href) ? "page" : undefined}
              >
                {label}
              </Link>
            ))}

            <details className={`main-nav__more${moreIsCurrent ? " is-current" : ""}`} key={pathname}>
              <summary className="main-nav__more-trigger">
                <span>Plus</span>
                <span className="main-nav__more-chevron" aria-hidden="true">⌄</span>
              </summary>
              <div className="main-nav__dropdown">
                {moreLinks.map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    className="main-nav__dropdown-link"
                    aria-current={isCurrentPath(pathname, href) ? "page" : undefined}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </details>
          </nav>

          <div className="topbar__member">
            <Link className="topbar__utility topbar__search" href="/recherche" aria-label="Rechercher sur Imetheran">
              <span aria-hidden="true">⌕</span>
              <span>Recherche</span>
            </Link>
            <AuthNav />
          </div>
        </div>
      </header>
      <span id="contenu-principal" className="skip-target" tabIndex={-1} />
    </>
  );
}
