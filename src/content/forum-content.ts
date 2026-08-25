export type ForumSectionKind = "community" | "universe" | "chronicles" | "campaign" | "game";
export type ForumSectionMode = "rp" | "non-rp";
export type ForumSectionAccess = "guest-read" | "members";

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
  mode: ForumSectionMode;
  access?: ForumSectionAccess;
  eyebrow: string;
  boards: ForumBoard[];
};

export const forumSections: ForumSection[] = [
  {
    id: "community",
    title: "La Communauté",
    subtitle: "Les portes d’entrée d’Imetheran, les nouvelles importantes et la vie quotidienne de la communauté.",
    kind: "community",
    mode: "non-rp",
    access: "guest-read",
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
    subtitle: "Espace hors-RP consacré à la préparation du jeu, aux personnages et à la recherche de partenaires.",
    kind: "universe",
    mode: "non-rp",
    access: "members",
    eyebrow: "Préparer le jeu",
    boards: [
      {
        id: "roleplay-guide",
        slug: "guide-du-roliste",
        title: "Guide du Rôliste",
        description: "Questions, conseils et échanges hors-RP autour des pratiques de jeu de rôle. Les guides finalisés pourront ensuite être publiés dans la rubrique Guides du site.",
        topics: 0,
        posts: 0,
      },
      {
        id: "characters",
        slug: "personnages",
        title: "Personnages",
        description: "Atelier hors-RP de création, demandes d’avis et discussions autour des fiches personnages hébergées sur Imetheran.",
        topics: 0,
        posts: 0,
      },
      {
        id: "roleplay-search",
        slug: "recherches-de-roleplay",
        title: "Recherches de Rôleplay",
        description: "Organisez une future scène, cherchez des partenaires ou proposez une idée de jeu avant son lancement en RP.",
        badge: "Organisation HRP",
        topics: 0,
        posts: 0,
      },
    ],
  },
  {
    id: "chronicles",
    title: "Chroniques",
    subtitle: "La grande zone RP d’Imetheran : scènes libres, scénarios fil rouge et histoires ciblées entre membres.",
    kind: "chronicles",
    mode: "rp",
    access: "members",
    eyebrow: "Rôleplay communautaire",
    boards: [
      {
        id: "free-roleplay",
        slug: "roleplay-libre",
        title: "Rôleplay Libre",
        description: "Scènes ouvertes, rencontres spontanées et récits qui ne dépendent pas d’un scénario communautaire particulier.",
        badge: "RP ouvert",
        topics: 0,
        posts: 0,
      },
      {
        id: "storylines",
        slug: "scenarios-fil-rouge",
        title: "Scénarios fil rouge",
        description: "Les grandes intrigues suivies dans le temps, leurs différents actes et les sujets RP qui composent leur progression.",
        badge: "Scénarios",
        topics: 0,
        posts: 0,
      },
      {
        id: "targeted-roleplay",
        slug: "roleplay-cible",
        title: "Rôleplays ciblés",
        description: "Scènes prévues entre certains membres ou personnages, pour développer une relation, une intrigue ou un objectif précis.",
        badge: "Entre membres",
        topics: 0,
        posts: 0,
      },
    ],
  },
  {
    id: "evercold",
    title: "Evercold",
    subtitle: "Espace RP saisonnier dédié à la campagne active. Cette catégorie pourra être remplacée ou archivée depuis l’administration.",
    kind: "campaign",
    mode: "rp",
    access: "members",
    eyebrow: "Campagne RP en cours",
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
    title: "Final Fantasy XIV",
    subtitle: "Le jeu en dehors du rôleplay : actualités, contenu, entraide et discussions entre joueurs.",
    kind: "game",
    mode: "non-rp",
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
