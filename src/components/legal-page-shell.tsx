import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

type LegalPageShellProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
};

export function LegalPageShell({ eyebrow, title, intro, children }: LegalPageShellProps) {
  return (
    <main className="site-shell legal-page">
      <SiteHeader />
      <section className="legal-hero">
        <div className="content-frame legal-hero__content">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{intro}</p>
        </div>
      </section>
      <section className="content-frame legal-workspace">
        <nav className="legal-nav" aria-label="Informations légales">
          <Link href="/mentions-legales">Mentions légales</Link>
          <Link href="/confidentialite">Confidentialité</Link>
          <Link href="/confidentialite/demande">Exercer mes droits</Link>
          <Link href="/guides/charte">Charte communautaire</Link>
        </nav>
        <article className="legal-content">{children}</article>
      </section>
    </main>
  );
}
