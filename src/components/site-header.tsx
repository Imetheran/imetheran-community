import Link from "next/link";

const links = [
  ["Accueil", "/"],
  ["Guides", "/guides"],
  ["Chroniques", "/chroniques"],
  ["Gazettes", "/gazettes"],
  ["Personnages", "/personnages"],
  ["Liens", "/liens"],
  ["Administration", "/administration"],
] as const;

export function SiteHeader() {
  return (
    <header className="topbar">
      <div className="topbar__ornament" aria-hidden="true">✦</div>
      <nav className="main-nav" aria-label="Navigation principale">
        {links.map(([label, href]) => (
          <Link key={href} href={href} className="main-nav__link">
            {label}
          </Link>
        ))}
      </nav>
      <div className="topbar__ornament" aria-hidden="true">✦</div>
    </header>
  );
}
