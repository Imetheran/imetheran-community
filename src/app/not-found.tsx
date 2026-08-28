import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <main className="site-shell auth-page">
      <SiteHeader />

      <section className="auth-hero">
        <div className="content-frame auth-hero__content">
          <p className="eyebrow">Erreur 404</p>
          <h1>Cette route ne mène nulle part</h1>
          <p>La page recherchée a peut-être été déplacée, archivée ou n’a jamais existé sur Imetheran.</p>
        </div>
      </section>

      <section className="content-frame auth-workspace">
        <div className="auth-grid auth-grid--single">
          <section className="auth-card" aria-labelledby="not-found-title">
            <p className="eyebrow">Reprendre la route</p>
            <h2 id="not-found-title">Retrouver la communauté</h2>
            <p>Vous pouvez revenir à l’accueil, rejoindre le forum ou utiliser la recherche pour retrouver un contenu précis.</p>
            <div className="hero__actions">
              <Link className="button button--primary" href="/">Retour à l’accueil</Link>
              <Link className="button button--ghost" href="/forum">Ouvrir le forum</Link>
              <Link className="text-link" href="/recherche">Rechercher sur Imetheran →</Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
