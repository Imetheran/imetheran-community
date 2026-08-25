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

export type ChronicleStatus = "upcoming" | "open" | "closed";
export type ChronicleChapterStatus = "completed" | "active" | "upcoming";

export type ChronicleChapter = {
  id: string;
  act: string;
  title: string;
  summary: string;
  body: string[];
  status: ChronicleChapterStatus;
  forumLabel?: string;
};

export type ChroniclePublication = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  synopsis: string;
  hook: string;
  status: ChronicleStatus;
  featured: boolean;
  coverImage: string;
  startedAt: string;
  location: string;
  organizer: string;
  participants: string[];
  tags: string[];
  chapters: ChronicleChapter[];
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

export const chronicles: ChroniclePublication[] = [
  {
    id: "chronicle-demo-001",
    slug: "les-echos-de-la-veille",
    title: "Les Échos de la Veille",
    subtitle: "Chronique communautaire · scénario de démonstration",
    synopsis:
      "Une série de messages incomplets circule entre plusieurs voyageurs. Aucun ne semble destiné au même destinataire, pourtant tous évoquent un rendez-vous oublié, une lumière au large et une dette que personne ne reconnaît.",
    hook:
      "Une chronique d’exemple conçue pour montrer comment un fil rouge pourra réunir scénario, progression, personnages et sujets de forum au même endroit.",
    status: "open",
    featured: true,
    coverImage:
      "https://lds-img.finalfantasyxiv.com/promo/h/b/IsIWQSvkiOGMfTAEcb97ehqVT4.jpg",
    startedAt: "2026-08-25",
    location: "Tural · environs de Tuliyollal",
    organizer: "Équipe RP d’Imetheran",
    participants: ["Personnage A", "Personnage B", "Personnage C", "Place libre"],
    tags: ["Enquête", "Exploration", "Mystère", "Ouvert aux inscriptions"],
    chapters: [
      {
        id: "acte-i",
        act: "Acte I",
        title: "Les lettres sans destinataire",
        summary:
          "Plusieurs plis semblables apparaissent dans des mains qui ne devaient jamais les recevoir. Les premières pistes convergent vers un même lieu.",
        status: "completed",
        forumLabel: "Sujet RP · archive de démonstration",
        body: [
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed posuere purus vitae justo congue, quis malesuada arcu facilisis. Integer vitae feugiat lorem, vitae faucibus lectus.",
          "Mauris blandit, risus ut consequat feugiat, nulla ligula feugiat eros, vitae placerat lectus nibh vel elit. Suspendisse potenti. Curabitur id justo a erat interdum posuere.",
        ],
      },
      {
        id: "acte-ii",
        act: "Acte II",
        title: "La lumière derrière la brume",
        summary:
          "La piste mène au littoral. Quelque chose répond aux signaux des voyageurs, mais rien ne permet encore de savoir s’il s’agit d’un appel ou d’un avertissement.",
        status: "active",
        forumLabel: "Sujet RP actif · exemple",
        body: [
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin sagittis, lacus sed pulvinar vulputate, sem nibh interdum erat, sed volutpat massa turpis vitae mi.",
          "Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; pellentesque vel urna vitae neque tristique dictum. Donec volutpat luctus nibh.",
          "Nam aliquet elit non nibh volutpat, vitae vestibulum lorem gravida. Donec vitae faucibus eros. Nulla facilisi. Integer feugiat mauris sed velit faucibus, at varius est finibus.",
        ],
      },
      {
        id: "acte-iii",
        act: "Acte III",
        title: "Ce qui attend au retour",
        summary:
          "La conclusion reste volontairement ouverte. Les choix faits pendant l’acte précédent détermineront les personnages, lieux et sujets qui apparaîtront ici.",
        status: "upcoming",
        forumLabel: "Sujet à ouvrir",
        body: [
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam vel lorem sed erat hendrerit suscipit. Duis vitae tincidunt nisi, sit amet vulputate neque.",
        ],
      },
    ],
  },
];

export const featuredGazette = gazettes.find(
  (gazette) => gazette.featured && gazette.status === "published",
) ?? gazettes[0];

export const featuredChronicle = chronicles.find(
  (chronicle) => chronicle.featured && chronicle.status !== "closed",
) ?? chronicles[0];

export function formatPublicationDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}
