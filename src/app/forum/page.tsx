import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { ThemeToggle } from "@/components/theme-toggle";

const categories = [
  ["La communauté", "Présentations, discussions générales et organisation de la vie communautaire."],
  ["Rôleplay", "Recherche de partenaires, RP libre, événements et archives des scènes."],
  ["Chroniques", "Sujets liés aux grandes histoires partagées et à leurs différents actes."],
  ["Lore & création", "Questions d’univers, création de personnages et ressources d’écriture."],
] as const;

export default function ForumPage() {
  return (
    <main className="site-shell forum-page">
      <SiteHeader />

      <section className="forum-hero">
        <div className="forum-hero__image" aria-hidden="true" />
        <div className="forum-hero__veil" aria-hidden="true" />
        <div className="content-frame forum-hero__content">
          <p className="eyebrow">Place publique</p>
          <h1>Forum</h1>
          <p>Le futur espace de discussion d’Imetheran : rôleplay, organisation communautaire, chroniques et mémoire des récits.</p>
          <ThemeToggle />
        </div>
      </section>

      <section className="forum-index content-frame" aria-labelledby="forum-index-title">
        <header className="section-heading">
          <p className="eyebrow">Ouverture prochaine</p>
          <h2 id="forum-index-title">Les espaces du forum</h2>
          <p>La structure est prête à accueillir les premières discussions. Les compteurs et derniers messages seront branchés lorsque le système de forum sera connecté.</p>
        </header>

        <div className="forum-grid forum-grid--index">
          {categories.map(([title, description], index) => (
            <article className="forum-category forum-category--static" key={title}>
              <span className="forum-category__index">0{index + 1}</span>
              <span className="forum-category__content">
                <small>Catégorie</small>
                <strong>{title}</strong>
                <span>{description}</span>
              </span>
              <span className="status-pill status-pill--quiet">Bientôt</span>
            </article>
          ))}
        </div>

        <div className="forum-index__footer">
          <Link className="text-link" href="/">← Retour à l’accueil</Link>
        </div>
      </section>
    </main>
  );
}
