import type { Metadata } from "next";
import { CommunityGuideLayout } from "@/components/community-guide-layout";

export const metadata: Metadata = {
  title: "Cadre rôleplay",
  description: "Les repères de jeu de rôle d’Imetheran : consentement, cohérence, conflits, lore et séparation entre personnage et joueur.",
};

const rpRules = [
  {
    title: "Séparer le joueur du personnage",
    text: "Un personnage peut mentir, échouer, se montrer désagréable ou entrer en conflit sans que cela décrive la personne qui l’écrit. À l’inverse, un conflit entre joueurs ne doit pas être réglé à travers les personnages.",
  },
  {
    title: "Laisser aux autres la maîtrise de leur personnage",
    text: "Décrivez vos intentions et vos actions sans décider seul de leurs conséquences sur quelqu’un d’autre. Évitez le godmodding, les blessures imposées, la lecture de pensée automatique ou les actions qui retirent toute possibilité de réaction.",
  },
  {
    title: "Accorder les scènes sensibles",
    text: "Conflits violents, blessures lourdes, romance, thèmes difficiles ou conséquences durables gagnent à être coordonnés hors-RP. Quelques messages suffisent souvent pour vérifier les limites et éviter un malaise inutile.",
  },
  {
    title: "Jouer avec le lore sans l’utiliser comme une arme",
    text: "Final Fantasy XIV fournit un cadre commun. Les interprétations peuvent varier tant qu’elles ne servent pas à invalider constamment le jeu des autres. En cas de divergence, discutez de ce qui est nécessaire à la scène plutôt que de chercher à gagner un débat de canon.",
  },
  {
    title: "Respecter le rythme des partenaires",
    text: "Tout le monde n’écrit pas à la même vitesse ni avec la même longueur. Annoncez une absence ou un rythme très lent lorsqu’une scène dépend fortement de vous, et évitez de relancer de manière insistante.",
  },
  {
    title: "Accepter que toutes les accroches ne fonctionnent pas",
    text: "Une proposition de relation, de scène ou de chronique peut être refusée sans jugement sur votre personnage ou votre écriture. Chercher la compatibilité de jeu est plus utile que forcer une interaction qui ne convient pas aux deux côtés.",
  },
] as const;

export default function RoleplayFrameworkPage() {
  return (
    <CommunityGuideLayout
      active="roleplay"
      eyebrow="Rôleplay communautaire"
      title="Cadre RP"
      intro="Des repères communs pour garder la liberté d’écriture sans transformer une scène en rapport de force entre joueurs."
    >
      <section className="guide-article-section guide-article-section--lead">
        <p className="eyebrow">Notre manière de jouer</p>
        <h2>Co-écrire plutôt que gagner.</h2>
        <p>
          Le RP sur Imetheran repose d’abord sur la collaboration. Une bonne scène n’est pas celle où un personnage domine tous les autres, mais celle où chaque participant dispose de matière pour réagir, proposer et faire évoluer l’histoire.
        </p>
      </section>

      <section className="guide-principles guide-principles--rp" aria-label="Repères de rôleplay">
        {rpRules.map((rule, index) => (
          <article className="guide-principle" key={rule.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h2>{rule.title}</h2>
              <p>{rule.text}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="guide-article-columns">
        <div className="guide-article-section">
          <p className="eyebrow">Avant une scène</p>
          <h2>Trois questions suffisent souvent.</h2>
          <ul>
            <li>Quel est le point de départ de la scène ?</li>
            <li>Y a-t-il un thème ou une conséquence à éviter ?</li>
            <li>Souhaite-t-on une scène ouverte, ciblée ou un résultat particulier à préparer ensemble ?</li>
          </ul>
        </div>
        <div className="guide-article-section">
          <p className="eyebrow">Pendant la scène</p>
          <h2>Gardez une porte de sortie.</h2>
          <p>
            Si un passage devient inconfortable ou si la scène prend une direction inattendue, il est toujours acceptable de faire une pause hors-RP, de reformuler une action ou de convenir d’une autre conséquence. La continuité fictionnelle passe après le confort des joueurs.
          </p>
        </div>
      </section>

      <aside className="guide-callout">
        <div>
          <p className="eyebrow">Le bon réflexe</p>
          <h2>Parlez hors-RP avant que l’interprétation ne devienne un conflit.</h2>
        </div>
        <p>
          Un message simple du type « je veux vérifier qu’on est sur la même longueur d’onde » résout souvent ce qu’une dizaine de réponses ambiguës aggraveraient.
        </p>
      </aside>
    </CommunityGuideLayout>
  );
}
