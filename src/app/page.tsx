import { FeatureCard } from "@/components/feature-card";
import { SiteHeader } from "@/components/site-header";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="site-shell">
      <SiteHeader />

      <section className="hero" aria-labelledby="site-title">
        <div className="hero__image" aria-hidden="true" />
        <div className="hero__veil" aria-hidden="true" />

        <div className="hero__content">
          <div className="expansion-logo expansion-logo--dawntrail" aria-label="Final Fantasy XIV Dawntrail" />
          <div className="expansion-logo expansion-logo--evercold" aria-label="Final Fantasy XIV Evercold" />

          <div className="brand-mark" aria-hidden="true">✥</div>
          <h1 id="site-title" className="brand-title">Imetheran</h1>
          <p className="brand-subtitle">Communauté Final Fantasy XIV</p>
          <p className="brand-motto">Rôleplay · Partage · Immersion</p>

          <ThemeToggle />
        </div>
      </section>

      <section className="welcome" aria-labelledby="welcome-title">
        <div className="welcome__visual welcome__visual--left" aria-hidden="true" />
        <article className="welcome__panel">
          <p className="eyebrow">Le foyer des récits</p>
          <h2 id="welcome-title">Bienvenue sur Imetheran</h2>
          <p>
            Imetheran est une communauté francophone consacrée au rôleplay sur Final Fantasy XIV.
            Ici, les histoires prennent vie à travers vos personnages, vos choix et vos écrits.
          </p>
          <p>
            Que vous soyez voyageur en quête d’aventures, conteur d’histoires ou gardien de la mémoire,
            vous trouverez votre place parmi nous.
          </p>
          <div className="welcome__divider" aria-hidden="true"><span />◆<span /></div>
          <strong>À l’ancienne, comme autrefois.</strong>
        </article>
        <div className="welcome__visual welcome__visual--right" aria-hidden="true" />
      </section>

      <section className="features" aria-label="Rubriques de la communauté">
        <FeatureCard name="guides" title="Guides" href="/guides">
          Bases du rôleplay, création de personnage et modes d’emploi des futures fonctionnalités du site.
        </FeatureCard>
        <FeatureCard name="chroniques" title="Chroniques" href="/chroniques">
          Les fils rouges de la communauté : scénarios à venir, ouverts ou clôturés et leurs sujets de forum.
        </FeatureCard>
        <FeatureCard name="gazettes" title="Gazettes" href="/gazettes">
          Potins, événements, recettes, illustrations et nouvelles du monde, présentés comme un véritable journal RP.
        </FeatureCard>
        <FeatureCard name="personnages" title="Personnages" href="/personnages">
          Créez et éditez votre fiche de personnage, son histoire, ses informations RP et ses repères essentiels.
        </FeatureCard>
        <FeatureCard name="liens" title="Liens" href="/liens">
          Explorez le sociogramme vivant de la communauté et les relations qui unissent les personnages.
        </FeatureCard>
        <FeatureCard name="administration" title="Administration" href="/administration">
          Espace réservé à l’équipe pour gérer les contenus, les membres et les outils communautaires.
        </FeatureCard>
      </section>

      <footer className="site-footer">
        <p>Imetheran · Communauté non officielle Final Fantasy XIV</p>
        <p>FINAL FANTASY XIV © SQUARE ENIX CO., LTD. Tous droits réservés.</p>
      </footer>
    </main>
  );
}
