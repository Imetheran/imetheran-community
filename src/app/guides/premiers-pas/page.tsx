import type { Metadata } from "next";
import Link from "next/link";
import { CommunityGuideLayout } from "@/components/community-guide-layout";

export const metadata: Metadata = {
  title: "Premiers pas",
  description: "Le parcours conseillé pour rejoindre Imetheran, préparer son profil, son personnage et ses premiers échanges.",
};

const steps = [
  {
    marker: "01",
    title: "Poser son identité membre",
    text: "Choisissez un nom affiché reconnaissable et ajoutez quelques mots sur votre façon de jouer, vos envies ou vos disponibilités. Votre profil membre reste distinct de vos personnages RP.",
    href: "/compte",
    action: "Compléter mon profil",
  },
  {
    marker: "02",
    title: "Lire les règles communes",
    text: "La charte pose le cadre de respect, de consentement et de modération qui s’applique partout sur Imetheran. Le cadre RP précise ensuite les usages propres aux scènes et personnages.",
    href: "/guides/charte",
    action: "Lire la charte",
  },
  {
    marker: "03",
    title: "Se présenter à la communauté",
    text: "La présentation n’est pas un examen. Quelques lignes suffisent pour dire ce qui vous amène, votre expérience éventuelle de FFXIV ou du RP et ce que vous aimeriez trouver ici.",
    href: "/forum/presentations",
    action: "Voir les présentations",
  },
  {
    marker: "04",
    title: "Créer ou découvrir des personnages",
    text: "Une fiche de personnage sert de point d’ancrage : identité, histoire, accroches de jeu et relations. Vous pouvez aussi commencer simplement par parcourir les fiches existantes avant de publier la vôtre.",
    href: "/personnages",
    action: "Explorer les personnages",
  },
  {
    marker: "05",
    title: "Trouver son premier échange",
    text: "Rejoignez une discussion, cherchez des partenaires, suivez une chronique ou proposez une scène. Il n’est pas nécessaire de tout utiliser dès le premier jour : commencez par l’espace qui vous attire le plus.",
    href: "/forum",
    action: "Entrer sur le forum",
  },
] as const;

export default function FirstStepsGuidePage() {
  return (
    <CommunityGuideLayout
      active="premiers-pas"
      eyebrow="Bienvenue sur Imetheran"
      title="Premiers pas"
      intro="Un parcours simple pour passer de la découverte du site à vos premiers échanges, sans vous demander de tout comprendre ni de tout remplir d’un coup."
    >
      <section className="guide-article-section guide-article-section--lead">
        <p className="eyebrow">Le principe</p>
        <h2>Commencez petit, puis laissez les liens se créer.</h2>
        <p>
          Imetheran rassemble plusieurs outils — forum, personnages, relations, chroniques et gazettes — mais aucun ne constitue une obligation. Le bon point de départ est celui qui vous donne envie de parler aux autres et de jouer.
        </p>
        <p>
          Chaque étape ci-dessous s’ouvre dans un nouvel onglet afin de garder ce parcours disponible comme fil conducteur.
        </p>
      </section>

      <section className="guide-step-list" aria-label="Parcours conseillé">
        {steps.map((step) => (
          <article className="guide-step" key={step.marker}>
            <span className="guide-step__marker">{step.marker}</span>
            <div>
              <h2>{step.title}</h2>
              <p>{step.text}</p>
              <Link
                className="text-link"
                href={step.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${step.action} — ouvre dans un nouvel onglet`}
              >
                {step.action} ↗
              </Link>
            </div>
          </article>
        ))}
      </section>

      <aside className="guide-callout">
        <div>
          <p className="eyebrow">À retenir</p>
          <h2>Vous n’avez rien à prouver pour participer.</h2>
        </div>
        <p>
          Débutant en RP, joueur expérimenté, lecteur discret ou auteur très actif : chacun peut prendre sa place à son rythme. Posez des questions quand un usage n’est pas clair et privilégiez les échanges simples plutôt que la peur de “mal faire”.
        </p>
      </aside>
    </CommunityGuideLayout>
  );
}

