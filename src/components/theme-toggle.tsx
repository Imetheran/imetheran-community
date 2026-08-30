"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type Theme =
  | "realm-reborn"
  | "heavensward"
  | "stormblood"
  | "shadowbringers"
  | "endwalker"
  | "dawntrail"
  | "evercold";

export const themes: ReadonlyArray<{ value: Theme; label: string; subtitle: string }> = [
  { value: "realm-reborn", label: "A Realm Reborn", subtitle: "Cristal & renaissance" },
  { value: "heavensward", label: "Heavensward", subtitle: "Azur & dragons" },
  { value: "stormblood", label: "Stormblood", subtitle: "Carmin & rébellion" },
  { value: "shadowbringers", label: "Shadowbringers", subtitle: "Ombre & lumière" },
  { value: "endwalker", label: "Endwalker", subtitle: "Étoiles & crépuscule" },
  { value: "dawntrail", label: "Dawntrail", subtitle: "Soleil & aventure" },
  { value: "evercold", label: "Evercold", subtitle: "Glace & mystère" },
];

export function isTheme(value: string | null): value is Theme {
  return themes.some((theme) => theme.value === value);
}

function applyTheme(nextTheme: Theme) {
  document.documentElement.dataset.theme = nextTheme;
  window.localStorage.setItem("imetheran-theme", nextTheme);
}

/**
 * Ancien point d'insertion conservé le temps que les pages historiques soient nettoyées.
 * Le sélecteur est rendu une seule fois depuis le layout racine, dans le pied de page global.
 */
export function ThemeToggle() {
  return null;
}

export function GlobalThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>("dawntrail");

  useEffect(() => {
    const saved = window.localStorage.getItem("imetheran-theme");
    const initial: Theme = isTheme(saved) ? saved : "dawntrail";

    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  const activeTheme = themes.find((item) => item.value === theme) ?? themes[5];

  function selectTheme(value: string) {
    if (!isTheme(value)) return;
    setTheme(value);
    applyTheme(value);
  }

  return (
    <footer className="site-global-footer">
      <div className="site-global-footer__inner content-frame">
        <div className="site-global-footer__identity">
          <span className="site-global-footer__mark" aria-hidden="true">✦</span>
          <div>
            <strong>Imetheran</strong>
            <small>Communauté non officielle Final Fantasy XIV</small>
          </div>
        </div>

        <nav className="site-global-footer__links" aria-label="Liens de pied de page">
          <Link href="/mentions-legales">Mentions légales</Link>
          <Link href="/confidentialite">Confidentialité</Link>
        </nav>

        <label className="footer-theme-control">
          <span className="footer-theme-control__label">Ambiance</span>
          <span className="footer-theme-control__field">
            <select
              value={theme}
              onChange={(event) => selectTheme(event.target.value)}
              aria-label="Choisir l’ambiance visuelle"
            >
              {themes.map((item) => (
                <option value={item.value} key={item.value}>{item.label}</option>
              ))}
            </select>
            <span aria-hidden="true">⌄</span>
          </span>
          <small>{activeTheme.subtitle}</small>
        </label>
      </div>

      <div className="site-global-footer__legal content-frame">
        <span>FINAL FANTASY XIV © SQUARE ENIX CO., LTD. Tous droits réservés.</span>
        <span>Site communautaire non officiel.</span>
      </div>
    </footer>
  );
}
