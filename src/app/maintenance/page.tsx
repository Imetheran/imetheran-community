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

export default function MaintenancePage() {
  const title = process.env.MAINTENANCE_TITLE?.trim() || "Les portes d’Imetheran se reposent un instant";
  const message =
    process.env.MAINTENANCE_MESSAGE?.trim() ||
    "Le site est momentanément indisponible pendant que nous préparons la suite. Merci pour votre patience — l’équipe remet tout en ordre au plus vite.";
  const eta = process.env.MAINTENANCE_ETA?.trim() || "Retour dès que possible.";

  return (
    <main className="maintenance-page">
      <div className="maintenance-atmosphere" aria-hidden="true">
        <span className="maintenance-star maintenance-star--one">✦</span>
        <span className="maintenance-star maintenance-star--two">✧</span>
        <span className="maintenance-star maintenance-star--three">✦</span>
      </div>

      <header className="maintenance-header content-frame">
        <a className="maintenance-brand" href="/maintenance" aria-label="Imetheran — maintenance">
          <span aria-hidden="true">✦</span>
          <strong>Imetheran</strong>
        </a>
        <span className="maintenance-status"><i aria-hidden="true" /> Maintenance en cours</span>
      </header>

      <section className="maintenance-hero content-frame">
        <div className="maintenance-hero__sigil" aria-hidden="true"><span>✦</span></div>
        <p className="eyebrow">Une petite halte avant de repartir</p>
        <h1>{title}</h1>
        <p className="maintenance-hero__message">{message}</p>
        <div className="maintenance-hero__eta">
          <span aria-hidden="true">◇</span>
          <strong>{eta}</strong>
        </div>
        <a className="button button--ghost maintenance-check" href="/">
          Vérifier si le site est revenu
        </a>
      </section>

      <section className="maintenance-games content-frame" aria-labelledby="maintenance-games-title">
        <header className="maintenance-games__heading">
          <p className="eyebrow">En attendant</p>
          <h2 id="maintenance-games-title">Deux petites occupations</h2>
          <p>Les jeux tournent entièrement dans votre navigateur : aucun compte ni accès au site n’est nécessaire.</p>
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
