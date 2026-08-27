import type { Metadata } from "next";
import { MaintenanceGames } from "./maintenance-games";

export const metadata: Metadata = {
  title: "Maintenance",
  description: "Imetheran est momentanément indisponible pendant une opération de maintenance.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

const maintenanceSteps = [
  {
    label: "En cours",
    title: "Accès public temporairement suspendu",
    text: "Imetheran reste volontairement fermé le temps de terminer l’intervention et les vérifications nécessaires.",
    state: "active",
  },
  {
    label: "Ensuite",
    title: "Contrôle des espaces communautaires",
    text: "Forum, contenus éditoriaux et outils communautaires seront vérifiés avant la réouverture.",
    state: "next",
  },
  {
    label: "Réouverture",
    title: "Retour à la normale",
    text: "L’accès sera rétabli dès que la version en ligne aura passé les derniers contrôles.",
    state: "next",
  },
] as const;

export default function MaintenancePage() {
  const title = process.env.MAINTENANCE_TITLE?.trim() || "Imetheran ferme ses portes quelques instants";
  const message =
    process.env.MAINTENANCE_MESSAGE?.trim() ||
    "Le site est momentanément indisponible pendant que nous préparons la suite. Merci pour votre patience — l’équipe remet tout en ordre avant de vous laisser reprendre votre route.";
  const eta = process.env.MAINTENANCE_ETA?.trim() || "Retour dès que possible.";

  return (
    <main className="maintenance-page">
      <div className="maintenance-atmosphere" aria-hidden="true">
        <span className="maintenance-star maintenance-star--one">✦</span>
        <span className="maintenance-star maintenance-star--two">✧</span>
      </div>

      <header className="maintenance-header content-frame">
        <a className="maintenance-brand" href="/maintenance" aria-label="Imetheran — maintenance">
          <span aria-hidden="true">✦</span>
          <strong>Imetheran</strong>
        </a>
        <span className="maintenance-status"><i aria-hidden="true" /> Maintenance en cours</span>
      </header>

      <section className="maintenance-hero" aria-labelledby="maintenance-title">
        <div className="maintenance-hero__scene" aria-hidden="true" />
        <div className="maintenance-hero__veil" aria-hidden="true" />
        <div className="maintenance-hero__content content-frame">
          <div className="maintenance-hero__sigil" aria-hidden="true"><span>✦</span></div>
          <p className="eyebrow">Imetheran est momentanément indisponible</p>
          <h1 id="maintenance-title">{title}</h1>
          <p className="maintenance-hero__message">{message}</p>

          <div className="maintenance-hero__meta" aria-label="État de la maintenance">
            <div className="maintenance-hero__eta">
              <span aria-hidden="true">◇</span>
              <div><small>Estimation</small><strong>{eta}</strong></div>
            </div>
            <div className="maintenance-hero__service">
              <span aria-hidden="true">●</span>
              <div><small>Service</small><strong>Accès public suspendu</strong></div>
            </div>
          </div>

          <a className="button button--ghost maintenance-check" href="/">
            Vérifier si le site est revenu
          </a>
          <p className="maintenance-hero__note">Aucune action n’est requise de votre côté.</p>
        </div>
      </section>

      <section className="maintenance-log content-frame" aria-labelledby="maintenance-log-title">
        <header className="maintenance-log__heading">
          <p className="eyebrow">Journal de bord</p>
          <h2 id="maintenance-log-title">Pendant la maintenance</h2>
          <p>Cette chronologie présente les grandes étapes de l’intervention. Elle pourra ensuite être alimentée directement depuis l’administration d’Imetheran.</p>
        </header>

        <ol className="maintenance-timeline">
          {maintenanceSteps.map((step, index) => (
            <li className={`maintenance-timeline__item maintenance-timeline__item--${step.state}`} key={step.title}>
              <div className="maintenance-timeline__marker" aria-hidden="true"><span>{String(index + 1).padStart(2, "0")}</span></div>
              <div className="maintenance-timeline__copy">
                <small>{step.label}</small>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="maintenance-games content-frame" aria-labelledby="maintenance-games-title">
        <header className="maintenance-games__heading">
          <p className="eyebrow">En attendant</p>
          <h2 id="maintenance-games-title">Quelques minutes à passer</h2>
          <p>Deux petits jeux facultatifs tournent entièrement dans votre navigateur. Aucun compte ni accès aux données du site n’est nécessaire.</p>
        </header>
        <MaintenanceGames />
      </section>

      <footer className="maintenance-footer content-frame">
        <span>Imetheran · Communauté RP Final Fantasy XIV</span>
        <span>Merci de votre patience.</span>
      </footer>
    </main>
  );
}
