"use client";

import { useEffect, useState } from "react";

type Theme = "dawntrail" | "evercold";

const themes: ReadonlyArray<{ value: Theme; label: string; subtitle: string }> = [
  { value: "dawntrail", label: "Dawntrail", subtitle: "Soleil & aventure" },
  { value: "evercold", label: "Evercold", subtitle: "Glace & mystère" },
];

function isTheme(value: string | null): value is Theme {
  return themes.some((theme) => theme.value === value);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dawntrail");

  useEffect(() => {
    const saved = window.localStorage.getItem("imetheran-theme");
    const initial: Theme = isTheme(saved) ? saved : "dawntrail";

    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  function selectTheme(nextTheme: Theme) {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("imetheran-theme", nextTheme);
  }

  const activeTheme = themes.find((item) => item.value === theme) ?? themes[0];

  return (
    <label className="theme-selector">
      <span className="theme-selector__emblem" aria-hidden="true">✦</span>
      <span className="theme-selector__copy">
        <span className="theme-selector__label">Thème</span>
        <span className="theme-selector__meta">{activeTheme.subtitle}</span>
      </span>
      <span className="theme-selector__control">
        <select
          aria-label="Choisir le thème visuel d'Imetheran"
          value={theme}
          onChange={(event) => selectTheme(event.target.value as Theme)}
        >
          {themes.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <span className="theme-selector__chevron" aria-hidden="true">⌄</span>
      </span>
    </label>
  );
}
