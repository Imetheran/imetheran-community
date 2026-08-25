type IconName = "guides" | "chroniques" | "gazettes" | "personnages" | "liens" | "administration";

export function FeatureIcon({ name }: { name: IconName }) {
  if (name === "liens") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="16" cy="32" r="6" />
        <circle cx="48" cy="16" r="6" />
        <circle cx="48" cy="48" r="6" />
        <path d="M21 29 43 19M21 35l22 10M48 22v20" />
      </svg>
    );
  }

  if (name === "chroniques") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="20" />
        <path d="m32 12 5 15 15 5-15 5-5 15-5-15-15-5 15-5Z" />
      </svg>
    );
  }

  if (name === "administration") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M32 8 50 16v14c0 12-7 21-18 26C21 51 14 42 14 30V16Z" />
        <path d="m24 32 6 6 11-13" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M18 10h25a5 5 0 0 1 5 5v39H23a7 7 0 0 1-7-7V12a2 2 0 0 1 2-2Z" />
      <path d="M23 18h17M23 26h17M23 34h12M23 44h15" />
      {name === "gazettes" && <path d="M40 36h5v11h-5z" />}
      {name === "personnages" && <circle cx="36" cy="31" r="5" />}
      {name === "guides" && <path d="m14 48 8-8" />}
    </svg>
  );
}
