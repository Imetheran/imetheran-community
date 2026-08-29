"use client";

import { useEffect, useRef, useState } from "react";

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
 * Le sélecteur est désormais rendu une seule fois depuis le layout racine.
 */
export function ThemeToggle() {
  return null;
}

export function GlobalThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>("dawntrail");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("imetheran-theme");
    const initial: Theme = isTheme(saved) ? saved : "dawntrail";

    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  useEffect(() => {
    if (!open) return;

    const closeOnOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function selectTheme(nextTheme: Theme) {
    setTheme(nextTheme);
    applyTheme(nextTheme);
    setOpen(false);
  }

  const activeTheme = themes.find((item) => item.value === theme) ?? themes[5];

  return (
    <div className="global-theme-switcher" ref={rootRef}>
      <div
        className="global-theme-switcher__panel"
        id="imetheran-theme-panel"
        hidden={!open}
        aria-label="Choisir l’ambiance visuelle"
      >
        <header className="global-theme-switcher__header">
          <div>
            <span>Ambiance visuelle</span>
            <strong>{activeTheme.label}</strong>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Fermer le sélecteur d’ambiance">×</button>
        </header>

        <div className="global-theme-switcher__options" role="radiogroup" aria-label="Thèmes visuels d’Imetheran">
          {themes.map((item, index) => {
            const active = item.value === theme;
            return (
              <button
                className="global-theme-switcher__option"
                type="button"
                role="radio"
                aria-checked={active}
                data-theme-option={item.value}
                key={item.value}
                onClick={() => selectTheme(item.value)}
              >
                <span className="global-theme-switcher__index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <span className="global-theme-switcher__swatch" aria-hidden="true" />
                <span className="global-theme-switcher__copy">
                  <strong>{item.label}</strong>
                  <small>{item.subtitle}</small>
                </span>
                <span className="global-theme-switcher__check" aria-hidden="true">{active ? "✓" : ""}</span>
              </button>
            );
          })}
        </div>

        <small className="global-theme-switcher__note">Les six extensions suivent leur ordre de sortie. Evercold reste l’ambiance originale d’Imetheran.</small>
      </div>

      <button
        className="global-theme-switcher__trigger"
        type="button"
        aria-expanded={open}
        aria-controls="imetheran-theme-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="global-theme-switcher__trigger-mark" aria-hidden="true">✦</span>
        <span className="global-theme-switcher__trigger-copy">
          <small>Ambiance</small>
          <strong>{activeTheme.label}</strong>
        </span>
        <span className="global-theme-switcher__trigger-arrow" aria-hidden="true">{open ? "↓" : "↑"}</span>
      </button>
    </div>
  );
}
