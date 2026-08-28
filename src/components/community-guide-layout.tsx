import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

const guideNavigation = [
  { slug: "premiers-pas", label: "Premiers pas", marker: "01" },
  { slug: "charte", label: "Charte", marker: "02" },
  { slug: "roleplay", label: "Cadre RP", marker: "03" },
] as const;

export function CommunityGuideLayout({
  active,
  eyebrow,
  title,
  intro,
  children,
}: {
  active: (typeof guideNavigation)[number]["slug"];
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main className="site-shell guides-page guide-article-page">
      <SiteHeader />

      <section className="guide-article-hero">
        <div className="content-frame guide-article-hero__content">
          <nav className="guide-article-breadcrumbs" aria-label="Fil d’Ariane">
            <Link href="/guides">Guides</Link><span>›</span><span>{title}</span>
          </nav>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{intro}</p>
        </div>
      </section>

      <div className="guide-article-nav-wrap">
        <nav className="content-frame guide-article-nav" aria-label="Parcours de bienvenue">
          {guideNavigation.map((item) => (
            <Link
              href={`/guides/${item.slug}`}
              className={item.slug === active ? "is-active" : ""}
              aria-current={item.slug === active ? "page" : undefined}
              key={item.slug}
            >
              <span>{item.marker}</span>
              <strong>{item.label}</strong>
            </Link>
          ))}
        </nav>
      </div>

      <article className="content-frame guide-article-content">
        {children}
      </article>

      <section className="guide-article-footer">
        <div className="content-frame guide-article-footer__layout">
          <div>
            <p className="eyebrow">Continuer l’aventure</p>
            <h2>Le meilleur guide reste la communauté.</h2>
            <p>Une fois les repères posés, présentez-vous, découvrez les personnages et rejoignez les échanges qui vous ressemblent.</p>
          </div>
          <div className="guide-article-footer__actions">
            <Link className="button button--primary" href="/forum/presentations">Se présenter</Link>
            <Link className="button button--ghost" href="/forum">Explorer le forum</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
