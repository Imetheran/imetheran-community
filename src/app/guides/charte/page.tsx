import type { Metadata } from "next";
import { CommunityGuideLayout } from "@/components/community-guide-layout";

export const metadata: Metadata = {
  title: "Charte communautaire",
  description: "Le cadre commun d’Imetheran pour des échanges respectueux, sûrs et agréables entre membres.",
};

const principles = [
  {
    title: "Respecter les personnes avant les désaccords",
    text: "Les critiques d’idées, de récits ou de choix de jeu sont possibles ; les attaques personnelles, humiliations, provocations répétées, menaces, harcèlement et discriminations ne le sont pas.",
  },
  {
    title: "Respecter le consentement et les limites",
    text: "Un refus n’a pas à être négocié. Lorsqu’un échange ou un jeu touche à un sujet sensible, vérifiez que les personnes concernées souhaitent réellement poursuivre et acceptez qu’elles puissent interrompre la discussion ou la scène.",
  },
  {
    title: "Protéger la vie privée",
    text: "Ne publiez pas d’informations personnelles concernant une autre personne sans son accord. Les conflits privés, captures de conversations ou éléments permettant d’identifier quelqu’un ne doivent pas être exposés publiquement pour régler un différend.",
  },
  {
    title: "Partager sans nuire aux autres espaces",
    text: "Évitez le spam, les provocations hors sujet et les contenus volontairement trompeurs. Les révélations importantes sur l’histoire de Final Fantasy XIV doivent être annoncées clairement lorsqu’elles peuvent gâcher la découverte d’autres membres.",
  },
  {
    title: "Utiliser les outils de modération plutôt que l’escalade",
    text: "En cas de problème sérieux, utilisez le signalement ou contactez l’équipe au lieu d’organiser une confrontation publique. La modération peut demander une correction, masquer un contenu ou restreindre temporairement la participation si nécessaire.",
  },
] as const;

export default function CommunityCharterPage() {
  return (
    <CommunityGuideLayout
      active="charte"
      eyebrow="Cadre communautaire"
      title="Charte"
      intro="Quelques règles simples pour que les discussions, créations et désaccords restent compatibles avec une communauté où l’on a envie de revenir."
    >
      <section className="guide-article-section guide-article-section--lead">
        <p className="eyebrow">Notre point de départ</p>
        <h2>La bienveillance n’interdit ni le débat ni les limites.</h2>
        <p>
          Imetheran n’attend pas des membres qu’ils soient toujours d’accord. La communauté demande en revanche que les désaccords restent dirigés vers les idées et les situations, jamais vers la dignité ou la sécurité des personnes.
        </p>
      </section>

      <section className="guide-principles" aria-label="Principes de la charte">
        {principles.map((principle, index) => (
          <article className="guide-principle" key={principle.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h2>{principle.title}</h2>
              <p>{principle.text}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="guide-article-section">
        <p className="eyebrow">Modération</p>
        <h2>Une réponse proportionnée, pas une logique de piège.</h2>
        <p>
          L’équipe privilégie lorsque c’est possible l’explication et la correction avant la sanction. La gravité, la répétition, l’intention apparente et l’impact sur les autres membres comptent dans l’évaluation d’une situation. Certains comportements graves peuvent toutefois justifier une restriction immédiate.
        </p>
        <p>
          Une décision de modération ne transforme pas un conflit en spectacle public. Si vous contestez une mesure, utilisez un échange direct et posé avec l’équipe plutôt qu’un nouveau sujet destiné à relancer le conflit.
        </p>
      </section>

      <aside className="guide-callout">
        <div>
          <p className="eyebrow">Règle simple</p>
          <h2>En cas de doute, demandez avant d’imposer.</h2>
        </div>
        <p>
          Cette règle fonctionne pour les conversations, les scènes RP, les relations entre personnages, les sujets sensibles et même la manière de plaisanter avec quelqu’un que vous connaissez encore peu.
        </p>
      </aside>
    </CommunityGuideLayout>
  );
}
