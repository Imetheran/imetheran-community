import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { ThemeToggle } from "@/components/theme-toggle";

const forumCategories = [
  { title: "La communauté", description: "Présentations, discussions générales et vie d’Imetheran.", meta: "Accueil & échanges" },
  { title: "Rôleplay", description: "Recherche de partenaires, RP libre, événements et archives.", meta: "Le cœur du forum" },
  { title: "Chroniques", description: "Les fils rouges communautaires et les sujets liés aux scénarios.", meta: "Histoires partagées" },
  { title: "Lore & création", description: "Univers, personnages, écriture et ressources pour enrichir vos récits.", meta: "Documentation RP" },
];

const editorialItems = [
  { kicker: "Gazette", title: "Les nouvelles d’Imetheran", text: "Potins, événements, recettes et récits présentés comme un véritable journal rôleplay.", href: "/gazettes" },
  { kicker: "Guides", title: "Préparer son personnage", text: "Retrouvez progressivement les bases du RP et les futurs modes d’emploi des outils communautaires.", href: "/guides" },
  { kicker: "Personnages", title: "Donner vie à son histoire", text: "Les futures fiches RP réuniront identité, histoire et relations de chaque personnage.", href: "/personnages" },
];

export default function Home() {
  return (
    <main className="site-shell">
      <SiteHeader />

      <section className="hero hero--portal" aria-labelledby="site-title">
        <div className="hero__image" aria-hidden="true" />
        <div className="hero__veil" aria-hidden="true" />

        <div className="hero__content content-frame">
          <div className="expansion-logo" aria-hidden="true" />
          <div className="hero__identity">
            <p className="brand-kicker">Communauté Final Fantasy XIV</p>
            <h1 id="site-title" className="brand-title">Imetheran</h1>
            <p className="brand-motto">Rôleplay · Partage · Immersion</p>
          </div>

          <div className="hero__actions">
            <Link className="button button--primary" href="/forum">Entrer sur le forum</Link>
            <a className="button button--ghost" href="#decouvrir">Découvrir la communauté</a>
          </div>

          <ThemeToggle />
        </div>
      </section>

      <section className="home-section home-section--activity" aria-labelledby="activity-title">
        <div className="content-frame">
          <header className="section-heading section-heading--row">
            <div>
              <p className="eyebrow">Le cœur de la communauté</p>
              <h2 id="activity-title">En ce moment sur Imetheran</h2>
            </div>
            <Link className="text-link" href="/forum">Voir le forum <span aria-hidden="true">→</span></Link>
          </header>

          <div className="activity-layout">
            <article className="panel panel--topics">
              <div className="panel__heading">
                <div>
                  <p className="panel__kicker">Discussions</p>
                  <h3>Derniers sujets</h3>
                </div>
                <span className="status-pill status-pill--quiet">Ouverture prochaine</span>
              </div>

              <div className="empty-feed">
                <span className="empty-feed__mark" aria-hidden="true">✦</span>
                <div>
                  <strong>Le forum se prépare.</strong>
                  <p>Les dernières discussions apparaîtront ici automatiquement dès que les premiers sujets seront publiés.</p>
                </div>
              </div>

              <div className="topic-preview" aria-label="Structure des futures discussions">
                <div><span className="topic-preview__icon">01</span><span><strong>Sujet</strong><small>Titre et auteur</small></span></div>
                <div><strong>Forum</strong><small>Catégorie</small></div>
                <div><strong>Activité</strong><small>Réponses</small></div>
                <div><strong>Dernier message</strong><small>Membre · date</small></div>
              </div>
            </article>

            <aside className="activity-sidebar" aria-label="Informations à retenir">
              <article className="panel notice-card">
                <p className="panel__kicker">À retenir</p>
                <h3>Bienvenue sur Imetheran</h3>
                <p>Le portail communautaire prend forme. Le forum, les chroniques et les fiches de personnages seront réunis dans un même espace.</p>
                <Link className="text-link" href="/forum">Découvrir le forum <span aria-hidden="true">→</span></Link>
              </article>
              <article className="panel compact-status">
                <div><span className="status-dot" aria-hidden="true" /><span>Chroniques ouvertes</span><strong>0</strong></div>
                <div><span className="status-dot status-dot--muted" aria-hidden="true" /><span>Événements annoncés</span><strong>0</strong></div>
                <div><span className="status-dot status-dot--muted" aria-hidden="true" /><span>Membres en ligne</span><strong>—</strong></div>
              </article>
            </aside>
          </div>
        </div>
      </section>

      <section className="home-section home-section--chronicles" aria-labelledby="chronicles-title">
        <div className="content-frame">
          <header className="section-heading section-heading--row">
            <div>
              <p className="eyebrow">Les fils rouges</p>
              <h2 id="chronicles-title">Chroniques en cours</h2>
            </div>
            <Link className="text-link" href="/chroniques">Toutes les chroniques <span aria-hidden="true">→</span></Link>
          </header>

          <article className="chronicle-feature">
            <div className="chronicle-feature__art" aria-hidden="true" />
            <div className="chronicle-feature__body">
              <span className="status-pill">À venir</span>
              <p className="panel__kicker">Première chronique</p>
              <h3>Les prochains récits prendront place ici</h3>
              <p>Chaque chronique réunira son synopsis, son statut, les personnages impliqués et les sujets de forum associés. Cette section deviendra le fil conducteur des grandes histoires de la communauté.</p>
              <Link className="button button--small" href="/chroniques">Explorer les chroniques</Link>
            </div>
          </article>
        </div>
      </section>

      <section className="home-section home-section--forum" aria-labelledby="forum-title">
        <div className="content-frame">
          <header className="section-heading section-heading--center">
            <p className="eyebrow">Place publique</p>
            <h2 id="forum-title">Le forum</h2>
            <p>Un espace pour discuter, écrire, organiser du RP et conserver la mémoire de la communauté.</p>
          </header>

          <div className="forum-grid">
            {forumCategories.map((category, index) => (
              <Link className="forum-category" href="/forum" key={category.title}>
                <span className="forum-category__index">0{index + 1}</span>
                <span className="forum-category__content">
                  <small>{category.meta}</small>
                  <strong>{category.title}</strong>
                  <span>{category.description}</span>
                </span>
                <span className="forum-category__arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-section--characters" aria-labelledby="characters-title">
        <div className="content-frame">
          <header className="section-heading section-heading--row">
            <div>
              <p className="eyebrow">Carnet de rencontres</p>
              <h2 id="characters-title">Personnages récemment actifs</h2>
            </div>
            <Link className="text-link" href="/personnages">Voir les personnages <span aria-hidden="true">→</span></Link>
          </header>

          <div className="character-empty panel">
            <div className="character-empty__portraits" aria-hidden="true">
              <span>?</span><span>?</span><span>?</span><span>?</span>
            </div>
            <div>
              <h3>Les visages d’Imetheran apparaîtront ici</h3>
              <p>Une fois les fiches de personnages ouvertes, cette zone mettra en avant les personnages ayant récemment participé aux discussions, chroniques et événements RP.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section home-section--editorial" aria-labelledby="editorial-title">
        <div className="content-frame">
          <header className="section-heading">
            <p className="eyebrow">Bibliothèque communautaire</p>
            <h2 id="editorial-title">À lire et à découvrir</h2>
          </header>
          <div className="editorial-grid">
            {editorialItems.map((item) => (
              <Link className="editorial-card" href={item.href} key={item.title}>
                <small>{item.kicker}</small>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <span>Découvrir <span aria-hidden="true">→</span></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="decouvrir" className="home-section home-section--about" aria-labelledby="about-title">
        <div className="content-frame about-strip">
          <div>
            <p className="eyebrow">Notre foyer</p>
            <h2 id="about-title">Bienvenue sur Imetheran</h2>
          </div>
          <p>Une communauté francophone Final Fantasy XIV consacrée au rôleplay, aux récits et aux personnages. Un lieu pensé pour retrouver l’esprit des forums d’autrefois avec des outils communautaires modernes.</p>
          <strong>À l’ancienne, comme autrefois.</strong>
        </div>
      </section>

      <footer className="site-footer content-frame">
        <p>Imetheran · Communauté non officielle Final Fantasy XIV</p>
        <p>FINAL FANTASY XIV © SQUARE ENIX CO., LTD. Tous droits réservés.</p>
      </footer>
    </main>
  );
}
