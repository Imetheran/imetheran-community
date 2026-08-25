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

        <div className="hero__content content-frame">
          <div className="expansion-logo" aria-hidden="true" />

          <div className="hero__identity">
            <div className="brand-mark" aria-hidden="true">✥</div>
            <p className="brand-kicker">Communauté Final Fantasy XIV</p>
            <h1 id="site-title" className="brand-title">Imetheran</h1>
            <p className="brand-motto">Rôleplay · Partage · Immersion</p>
          </div>

          <ThemeToggle />
        </div>
      </section>

      <section className="home-section home-section--welcome" aria-labelledby="welcome-title">
        <div className="content-frame">
          <div className="welcome">
            <div className="welcome__visual" aria-hidden="true" />
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
          </div>
        </div>
      </section>

      <section className="home-section home-section--features" aria-labelledby="features-title">
        <div className="content-frame">
          <header className="section-heading">
            <p className="eyebrow">Le registre d’Imetheran</p>
            <h2 id="features-title">Explorer la communauté</h2>
          </header>

          <div className="features">
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
          </div>
        </div>
      </section>

      <footer className="site-footer content-frame">
        <p>Imetheran · Communauté non officielle Final Fantasy XIV</p>
        <p>FINAL FANTASY XIV © SQUARE ENIX CO., LTD. Tous droits réservés.</p>
      </footer>
    </main>
  );
}
