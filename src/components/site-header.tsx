import Link from "next/link";
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

export function SiteHeader() {
  return (
    <header className="topbar">
      <div className="topbar__inner content-frame">
        <Link className="topbar__brand" href="/" aria-label="Accueil Imetheran">
          <span aria-hidden="true">✦</span>
          <strong>Imetheran</strong>
        </Link>

        <nav className="main-nav" aria-label="Navigation principale">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="main-nav__link">
              {label}
            </Link>
          ))}
        </nav>

        <div className="topbar__member">
          <span className="topbar__status">Communauté RP</span>
          <AuthNav />
        </div>
      </div>
    </header>
  );
}
