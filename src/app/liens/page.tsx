import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Sociogram } from "@/components/sociogram";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LinksPage() {
  return (
    <main className="site-shell links-page">
      <SiteHeader />

      <section className="links-hero" aria-labelledby="links-title">
        <div className="links-hero__image" aria-hidden="true" />
        <div className="links-hero__veil" aria-hidden="true" />
        <div className="content-frame links-hero__content">
          <p className="eyebrow">Sociogramme communautaire</p>
          <h1 id="links-title">Liens</h1>
          <p>
            Une cartographie vivante des affinités, dettes, rivalités et histoires qui relient les
            personnages d’Imetheran.
          </p>
          <div className="links-hero__actions">
            <ThemeToggle />
            <Link className="button button--ghost" href="/personnages">Voir les personnages</Link>
          </div>
        </div>
      </section>

      <section className="links-intro content-frame" aria-labelledby="sociogram-title">
        <header className="section-heading section-heading--row">
          <div>
            <p className="eyebrow">Carte des relations</p>
            <h2 id="sociogram-title">Le réseau d’Imetheran</h2>
            <p>
              Cette première maquette utilise les personnages de démonstration. Les liens seront ensuite
              créés et modifiés depuis les fiches personnages, avec contrôle de visibilité et validation
              des relations partagées.
            </p>
          </div>
          <span className="status-pill status-pill--quiet">Prototype interactif</span>
        </header>

        <Sociogram />
      </section>
    </main>
  );
}
