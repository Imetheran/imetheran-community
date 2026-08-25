import Link from "next/link";
import { SiteHeader } from "./site-header";
import { ThemeToggle } from "./theme-toggle";

export function SectionShell({ title, description }: { title: string; description: string }) {
  return (
    <main className="site-shell section-page">
      <SiteHeader />
      <section className="section-hero">
        <div className="section-hero__image" aria-hidden="true" />
        <div className="section-hero__content">
          <p className="eyebrow">Imetheran</p>
          <h1>{title}</h1>
          <p>{description}</p>
          <ThemeToggle />
          <Link className="back-link" href="/">← Retour à l’accueil</Link>
        </div>
      </section>
    </main>
  );
}
