export type ForumSectionKind = "community" | "roleplay" | "chronicles" | "campaign" | "game";

export type ForumBoard = {
  id: string;
  slug: string;
  title: string;
  description: string;
  badge?: string;
  topics: number;
  posts: number;
  lastActivity?: string;
};

export type ForumSection = {
  id: string;
  title: string;
  subtitle: string;
  kind: ForumSectionKind;
  eyebrow: string;
  boards: ForumBoard[];
};

export const forumSections: ForumSection[] = [
  {
    id: "community",
    title: "La Communauté",
    subtitle: "Les portes d’entrée d’Imetheran, les nouvelles importantes et la vie quotidienne de la communauté.",
    kind: "community",
    eyebrow: "Vie communautaire",
    boards: [
      {
        id: "announcements",
        slug: "annonces-informations",
        title: "Annonces & Informations",
        description: "Règlement, annonces de l’équipe, évolutions du site et informations importantes à connaître.",
        badge: "Officiel",
        topics: 0,
        posts: 0,
      },
      {
        id: "introductions",
        slug: "presentations",
        title: "Présentations",
        description: "Un premier pas parmi nous : présentez-vous, vos habitudes de jeu et ce qui vous amène sur Imetheran.",
        topics: 0,
        posts: 0,
      },
      {
        id: "general",
        slug: "discussions-generales",
        title: "Discussions Générales",
        description: "Le salon commun pour échanger, partager des idées et discuter de la vie de la communauté.",
        topics: 0,
        posts: 0,
      },
    ],
  },
  {
    id: "universe-roleplay",
    title: "Univers & Rôleplay",
    subtitle: "Tout ce qui aide à créer, comprendre et trouver du jeu autour de vos personnages.",
    kind: "roleplay",
    eyebrow: "Préparer le jeu",
    boards: [
      {
        id: "roleplay-guide",
        slug: "guide-du-roliste",
        title: "Guide du Rôliste",
        description: "Questions, conseils et échanges autour des pratiques RP. Les guides finalisés pourront être publiés dans la rubrique Guides du site.",
        topics: 0,
        posts: 0,
      },
      {
        id: "characters",
        slug: "personnages",
        title: "Personnages",
        description: "Atelier de création, demandes d’avis et discussions autour des fiches personnages hébergées sur Imetheran.",
        topics: 0,
        posts: 0,
      },
      {
        id: "roleplay-search",
        slug: "recherches-de-roleplay",
        title: "Recherches de Rôleplay",
        description: "Proposez une idée de scène, cherchez des partenaires ou rejoignez une intrigue ouverte.",
        badge: "Ouvert au jeu",
        topics: 0,
        posts: 0,
      },
    ],
  },
  {
    id: "chronicles",
    title: "Chroniques",
    subtitle: "Les récits partagés, expéditions et scènes libres qui constituent la mémoire RP de la communauté.",
    kind: "chronicles",
    eyebrow: "Récits partagés",
    boards: [
      {
        id: "eorzea-chronicles",
        slug: "chroniques-eorzea",
        title: "Chroniques d’Éorzéa",
        description: "Les grands récits communautaires et leurs sujets RP associés. Les dossiers de chronique restent consultables dans la rubrique Chroniques du site.",
        topics: 0,
        posts: 0,
      },
      {
        id: "expeditions",
        slug: "expeditions-quetes",
        title: "Expéditions & Quêtes",
        description: "Aventures ponctuelles, missions, explorations et propositions de jeu avec un objectif précis.",
        topics: 0,
        posts: 0,
      },
      {
        id: "free-roleplay",
        slug: "roleplay-libre",
        title: "Rôleplay Libre",
        description: "Scènes ouvertes ou spontanées qui ne dépendent pas d’une chronique ou d’un événement particulier.",
        topics: 0,
        posts: 0,
      },
    ],
  },
  {
    id: "evercold",
    title: "Evercold",
    subtitle: "Espace saisonnier dédié à la campagne active. Cette catégorie est pensée pour être remplacée ou archivée depuis l’administration.",
    kind: "campaign",
    eyebrow: "Campagne en cours",
    boards: [
      {
        id: "fourth-reflection",
        slug: "quatrieme-reflet",
        title: "Le Quatrième Reflet",
        description: "Le fil principal de la campagne Evercold : scènes majeures, conséquences et progression collective.",
        badge: "Saison active",
        topics: 0,
        posts: 0,
      },
      {
        id: "seasonal-intrigues",
        slug: "intrigues-saisonnieres",
        title: "Intrigues saisonnières",
        description: "Intrigues secondaires et ramifications liées à la campagne, ouvertes sur une période donnée.",
        topics: 0,
        posts: 0,
      },
      {
        id: "rp-events",
        slug: "evenements-rp",
        title: "Événements RP",
        description: "Organisation et suivi des rendez-vous RP liés à Evercold ou à la saison communautaire en cours.",
        topics: 0,
        posts: 0,
      },
    ],
  },
  {
    id: "ffxiv",
    title: "FINAL FANTASY XIV",
    subtitle: "Le jeu en dehors du rôleplay : actualités, contenu, entraide et discussions entre joueurs.",
    kind: "game",
    eyebrow: "Autour du jeu",
    boards: [
      {
        id: "news-patches",
        slug: "actualites-patchs",
        title: "Actualités & Patchs",
        description: "Discussions sur les annonces officielles, mises à jour, notes de patch et nouveautés de Final Fantasy XIV.",
        topics: 0,
        posts: 0,
      },
      {
        id: "gameplay-content",
        slug: "gameplay-contenu",
        title: "Gameplay & Contenu",
        description: "Donjons, raids, métiers, housing, collection, astuces et entraide autour des systèmes du jeu.",
        topics: 0,
        posts: 0,
      },
      {
        id: "off-topic",
        slug: "hors-jeu",
        title: "Hors-Jeu",
        description: "Le coin détente pour les discussions qui ne concernent ni le RP ni directement Final Fantasy XIV.",
        topics: 0,
        posts: 0,
      },
    ],
  },
];

export const forumBoardCount = forumSections.reduce((total, section) => total + section.boards.length, 0);
