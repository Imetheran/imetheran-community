export type PublicationStatus = "draft" | "scheduled" | "published" | "archived";

export type GazetteArticleKind = "lead" | "column" | "brief" | "recipe" | "quote";

export type GazetteArticle = {
  id: string;
  kind: GazetteArticleKind;
  kicker: string;
  title: string;
  body: string[];
  byline?: string;
  aside?: string;
};

export type GazettePublication = {
  id: string;
  slug: string;
  title: string;
  headline: string;
  edition: string;
  issueNumber: number;
  excerpt: string;
  publishedAt: string;
  status: PublicationStatus;
  featured: boolean;
  coverImage: string;
  highlights: string[];
  articles: GazetteArticle[];
};

export const gazettes: GazettePublication[] = [
  {
    id: "gazette-demo-001",
    slug: "numero-zero",
    title: "La Gazette d’Imetheran",
    headline: "Une communauté ouvre ses portes",
    edition: "Numéro zéro · Édition de démonstration",
    issueNumber: 0,
    excerpt:
      "Un premier numéro témoin pour poser le ton du futur journal rôleplay : nouvelles communautaires, carnets de voyage, rumeurs, recettes et rendez-vous à venir.",
    publishedAt: "2026-08-25",
    status: "published",
    featured: true,
    coverImage:
      "https://lds-img.finalfantasyxiv.com/promo/h/W/qkrq6gH_yeVJDGhASIQ_UWSvPo.jpg",
    highlights: ["Vie communautaire", "Carnet rôleplay", "Cuisine & curiosités"],
    articles: [
      {
        id: "ouverture",
        kind: "lead",
        kicker: "À la une",
        title: "Imetheran ouvre les portes de sa place publique",
        byline: "La rédaction",
        body: [
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae lectus sed sem fermentum posuere. Vivamus sollicitudin, justo nec luctus gravida, ipsum erat faucibus justo, sed tincidunt erat nibh et libero.",
          "Praesent vel risus id lorem posuere dictum. Donec feugiat, mauris non luctus tincidunt, justo neque feugiat nisl, vitae luctus mi massa vel nunc. Curabitur finibus sapien nec sapien sodales, vitae luctus velit tincidunt.",
          "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.",
        ],
      },
      {
        id: "rumeurs",
        kind: "column",
        kicker: "Les murmures du comptoir",
        title: "Trois rumeurs que personne ne confirme",
        byline: "Une plume indiscrète",
        body: [
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam erat volutpat. Morbi pretium augue id elit commodo, a feugiat lectus facilisis.",
          "Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; suspendisse potenti. Cras at nibh vitae augue condimentum posuere.",
        ],
        aside: "Rumeur n°1 — On aurait aperçu une caisse sans propriétaire changer trois fois de quai avant l’aube.",
      },
      {
        id: "agenda",
        kind: "brief",
        kicker: "Agenda",
        title: "À noter dans vos carnets",
        body: [
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.",
        ],
        aside: "Exemple : soirée d’accueil · rencontre RP · atelier d’écriture · sortie communautaire.",
      },
      {
        id: "recette",
        kind: "recipe",
        kicker: "Cuisine",
        title: "La marmite du voyageur pressé",
        byline: "Cuisine & curiosités",
        body: [
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce placerat, mauris vitae feugiat luctus, sapien enim bibendum libero, nec tempor turpis justo vitae est.",
          "Proin posuere sem id nisi tempor, vitae posuere nulla luctus. Servir chaud, raconter une histoire, puis prétendre que la recette venait d’un vieux carnet retrouvé au fond d’une sacoche.",
        ],
        aside: "Ingrédients de démonstration : 2 légumes, 1 bouillon, quelques herbes, beaucoup trop de sel selon le cuisinier.",
      },
      {
        id: "citation",
        kind: "quote",
        kicker: "Mot de la fin",
        title: "Une place pour les histoires qui continuent",
        body: [
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas euismod, sem id ullamcorper vulputate, lorem erat dignissim sem, et consequat nibh eros a justo.",
        ],
        aside: "« Les meilleurs récits commencent souvent par quelqu’un qui demande : et si on essayait ? »",
      },
    ],
  },
];

export const featuredGazette = gazettes.find(
  (gazette) => gazette.featured && gazette.status === "published",
) ?? gazettes[0];

export function formatPublicationDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}
