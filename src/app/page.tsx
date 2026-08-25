import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { featuredChronicle, featuredGazette, formatPublicationDate } from "@/content/editorial-content";

const forumCategories = [
  { title: "La communauté", description: "Présentations, discussions générales et vie d’Imetheran.", meta: "Accueil & échanges" },
  { title: "Rôleplay", description: "Recherche de partenaires, RP libre, événements et archives.", meta: "Le cœur du forum" },
  { title: "Chroniques", description: "Les fils rouges communautaires et les sujets liés aux scénarios.", meta: "Histoires partagées" },
  { title: "Lore & création", description: "Univers, personnages, écriture et ressources pour enrichir vos récits.", meta: "Documentation RP" },
];

const editorialItems = [
  { kicker: "Guides", title: "Préparer son personnage", text: "Retrouvez progressivement les bases du RP et les futurs modes d’emploi des outils communautaires.", href: "/guides" },
  { kicker: "Personnages", title: "Donner vie à son histoire", text: "Les futures fiches RP réuniront identité, histoire et relations de chaque personnage.", href: "/personnages" },
  { kicker: "Liens", title: "Tisser les relations", text: "Le futur sociogramme permettra d’explorer les liens, alliances, rivalités et rencontres entre personnages.", href: "/liens" },
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

      <section className="home-section home-section--gazette" aria-labelledby="gazette-title">
        <div className="content-frame">
          <header className="section-heading section-heading--row">
            <div>
              <p className="eyebrow">La presse d’Imetheran</p>
              <h2 id="gazette-title">Gazette à la une</h2>
            </div>
            <Link className="text-link" href="/gazettes">Toutes les gazettes <span aria-hidden="true">→</span></Link>
          </header>

          <article className="gazette-feature">
            <div
              className="gazette-cover"
              style={{ backgroundImage: `linear-gradient(180deg, rgba(7,7,7,.08), rgba(7,7,7,.66)), url(${featuredGazette.coverImage})` }}
              aria-hidden="true"
            >
              <div className="gazette-cover__topline">
                <span>Édition {String(featuredGazette.issueNumber).padStart(2, "0")}</span>
                <span>{formatPublicationDate(featuredGazette.publishedAt)}</span>
              </div>
              <div className="gazette-cover__masthead">{featuredGazette.title}</div>
              <div className="gazette-cover__headline">{featuredGazette.headline}</div>
              <span className="gazette-cover__demo">Exemple éditorial</span>
            </div>

            <div className="gazette-feature__story">
              <div className="gazette-feature__meta">
                <span className="status-pill">Publié</span>
                <span>{featuredGazette.edition}</span>
              </div>
              <p className="panel__kicker">Numéro mis en avant</p>
              <h3>{featuredGazette.headline}</h3>
              <p className="gazette-feature__excerpt">{featuredGazette.excerpt}</p>

              <div className="gazette-feature__contents">
                <span>Dans ce numéro</span>
                <ul>
                  {featuredGazette.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
                </ul>
              </div>

              <div className="gazette-feature__actions">
                <Link className="button button--primary" href={`/gazettes#${featuredGazette.slug}`}>Lire la gazette</Link>
                <span className="gazette-feature__cms-note">Numéro d’essai · contenu provisoire</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="home-section home-section--chronicles" aria-labelledby="chronicles-title">
        <div className="content-frame">
          <header className="section-heading section-heading--row">
            <div>
              <p className="eyebrow">Les fils rouges</p>
              <h2 id="chronicles-title">Chronique mise en avant</h2>
            </div>
            <Link className="text-link" href="/chroniques">Toutes les chroniques <span aria-hidden="true">→</span></Link>
          </header>

          <article className="chronicle-feature">
            <div
              className="chronicle-feature__art"
              style={{
                backgroundImage: `linear-gradient(90deg, transparent 58%, var(--surface)), linear-gradient(180deg, rgba(0,0,0,.12), rgba(0,0,0,.56)), url(${featuredChronicle.coverImage})`,
              }}
              aria-hidden="true"
            />
            <div className="chronicle-feature__body">
              <span className="status-pill">Ouverte · Démo</span>
              <p className="chronicle-feature__meta">{featuredChronicle.subtitle}</p>
              <h3>{featuredChronicle.title}</h3>
              <p>{featuredChronicle.synopsis}</p>
              <div className="chronicle-feature__details">
                <span>{featuredChronicle.location}</span>
                <span>{featuredChronicle.chapters.length} actes</span>
                <span>{featuredChronicle.participants.length} places affichées</span>
              </div>
              <Link className="button button--small" href={`/chroniques#${featuredChronicle.slug}`}>Ouvrir le dossier</Link>
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
