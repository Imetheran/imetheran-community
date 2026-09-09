"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthNav } from "@/components/auth-nav";

const navGroups = [
  {
    label: "Chroniques",
    links: [
      ["Toutes les chroniques", "/chroniques"],
      ["Gazettes", "/gazettes"],
    ],
  },
  {
    label: "Personnages",
    links: [
      ["Annuaire des personnages", "/personnages"],
      ["Liens", "/liens"],
    ],
  },
  {
    label: "Communauté",
    links: [
      ["Membres", "/membres"],
      ["Guides", "/guides"],
    ],
  },
] as const;

function isCurrentPath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavGroup({
  pathname,
  label,
  links,
  open,
  onToggle,
  onNavigate,
}: {
  pathname: string;
  label: string;
  links: readonly (readonly [string, string])[];
  open: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  const isCurrent = links.some(([, href]) => isCurrentPath(pathname, href));

  return (
    <details className={`main-nav__group${isCurrent ? " is-current" : ""}`} open={open}>
      <summary
        className="main-nav__group-trigger"
        onClick={(event) => {
          event.preventDefault();
          onToggle();
        }}
      >
        <span>{label}</span>
        <span className="main-nav__group-chevron" aria-hidden="true">⌄</span>
      </summary>
      <div className="main-nav__dropdown">
        {links.map(([itemLabel, href]) => (
          <Link
            key={href}
            href={href}
            className="main-nav__dropdown-link"
            aria-current={isCurrentPath(pathname, href) ? "page" : undefined}
            onClick={onNavigate}
          >
            {itemLabel}
          </Link>
        ))}
      </div>
    </details>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  useEffect(() => {
    setOpenGroup(null);
  }, [pathname]);

  const closeMenus = () => setOpenGroup(null);
  const toggleGroup = (label: string) => {
    setOpenGroup((current) => (current === label ? null : label));
  };

  return (
    <>
      <a className="skip-link" href="#contenu-principal">Aller au contenu</a>
      <header className="topbar">
        <div className="topbar__inner content-frame">
          <Link className="topbar__brand" href="/" aria-label="Accueil Imetheran" onClick={closeMenus}>
            <span className="topbar__brand-mark" aria-hidden="true">✦</span>
            <span className="topbar__brand-copy">
              <strong>Imetheran</strong>
              <small>Communauté RP · Moogle</small>
            </span>
          </Link>

          <nav className="main-nav" aria-label="Navigation principale">
            <Link
              href="/"
              className="main-nav__link main-nav__home"
              aria-current={pathname === "/" ? "page" : undefined}
              onClick={closeMenus}
            >
              Accueil
            </Link>

            <Link
              href="/forum"
              className="main-nav__link"
              aria-current={isCurrentPath(pathname, "/forum") ? "page" : undefined}
              onClick={closeMenus}
            >
              Forum
            </Link>

            <NavGroup
              pathname={pathname}
              {...navGroups[0]}
              open={openGroup === navGroups[0].label}
              onToggle={() => toggleGroup(navGroups[0].label)}
              onNavigate={closeMenus}
            />
            <NavGroup
              pathname={pathname}
              {...navGroups[1]}
              open={openGroup === navGroups[1].label}
              onToggle={() => toggleGroup(navGroups[1].label)}
              onNavigate={closeMenus}
            />

            <Link
              href="/evenements"
              className="main-nav__link"
              aria-current={isCurrentPath(pathname, "/evenements") ? "page" : undefined}
              onClick={closeMenus}
            >
              Événements
            </Link>

            <NavGroup
              pathname={pathname}
              {...navGroups[2]}
              open={openGroup === navGroups[2].label}
              onToggle={() => toggleGroup(navGroups[2].label)}
              onNavigate={closeMenus}
            />
          </nav>

          <div className="topbar__member">
            <Link className="topbar__utility topbar__search" href="/recherche" aria-label="Rechercher sur Imetheran" onClick={closeMenus}>
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
