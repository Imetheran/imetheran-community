export type ForumAuthor = {
  id: string;
  name: string;
  initials: string;
  role: "staff" | "member";
  characterSlug?: string;
  characterName?: string;
};

export type ForumPost = {
  id: string;
  author: ForumAuthor;
  postedAt: string;
  editedAt?: string;
  content: string[];
  signature?: string;
};

export type ForumTopic = {
  id: string;
  slug: string;
  boardSlug: string;
  title: string;
  excerpt: string;
  author: ForumAuthor;
  createdAt: string;
  lastActivity: string;
  replies: number;
  views: number;
  pinned?: boolean;
  locked?: boolean;
  status?: "open" | "closed" | "finished";
  tags: string[];
  posts: ForumPost[];
};

const staff: ForumAuthor = {
  id: "staff",
  name: "Équipe Imetheran",
  initials: "IM",
  role: "staff",
};

const aelys: ForumAuthor = {
  id: "aelys",
  name: "Aelys",
  initials: "AV",
  role: "member",
  characterSlug: "aelys-vardane",
  characterName: "Aelys Vardane",
};

const rhydan: ForumAuthor = {
  id: "rhydan",
  name: "Rhydan",
  initials: "RS",
  role: "member",
  characterSlug: "rhydan-sorel",
  characterName: "Rhydan Sorel",
};

const nahla: ForumAuthor = {
  id: "nahla",
  name: "Nahla",
  initials: "NR",
  role: "member",
  characterSlug: "nahla-rahn",
  characterName: "Nahla Rahn",
};

export const demoTopics: ForumTopic[] = [
  {
    id: "topic-rules-free-rp",
    slug: "fonctionnement-roleplay-libre",
    boardSlug: "roleplay-libre",
    title: "À lire — fonctionnement du Rôleplay Libre",
    excerpt: "Quelques repères pour ouvrir, rejoindre et conclure une scène libre sur Imetheran.",
    author: staff,
    createdAt: "25 août 2026 · 09:00",
    lastActivity: "25 août 2026 · 09:00",
    replies: 0,
    views: 42,
    pinned: true,
    locked: true,
    status: "open",
    tags: ["Information", "RP libre"],
    posts: [
      {
        id: "post-rules-1",
        author: staff,
        postedAt: "25 août 2026 · 09:00",
        content: [
          "Ce sujet de démonstration montre l’emplacement futur des règles propres à une section. Le Rôleplay Libre accueille les scènes qui ne dépendent pas d’un scénario fil rouge ou d’une campagne active.",
          "Lors de l’ouverture d’un sujet, l’auteur pourra préciser le lieu, le caractère ouvert ou fermé de la scène, les personnages recherchés et éventuellement une balise de contenu. Ces informations deviendront des métadonnées exploitables par les filtres du forum.",
        ],
      },
    ],
  },
  {
    id: "topic-lanternes",
    slug: "les-lanternes-de-la-rue-des-saphirs",
    boardSlug: "roleplay-libre",
    title: "[Ul’dah] Les lanternes de la rue des Saphirs",
    excerpt: "Une rencontre tardive sous les lanternes du marché, entre une piste incomplète et une dette dont personne ne parle vraiment.",
    author: aelys,
    createdAt: "24 août 2026 · 21:14",
    lastActivity: "25 août 2026 · 16:28",
    replies: 3,
    views: 28,
    status: "open",
    tags: ["RP libre", "Ul’dah", "Ouvert"],
    posts: [
      {
        id: "post-lanternes-1",
        author: aelys,
        postedAt: "24 août 2026 · 21:14",
        content: [
          "La chaleur du jour s’était enfin retirée des pierres, mais la rue des Saphirs refusait encore de dormir. Sous les auvents, quelques marchands achevaient leurs comptes tandis que les lanternes suspendues découpaient des îlots d’or sur les pavés.",
          "Aelys s’était installée à l’écart du passage, un feuillet plié entre deux doigts. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer accumsan, libero sed luctus posuere, neque lectus vulputate urna, vitae placerat elit sem at mauris. Elle relut une troisième fois la même ligne avant de relever les yeux vers la foule.",
          "Quelqu’un devait venir. Ou peut-être était-ce précisément le problème : personne n’avait jamais promis de venir.",
        ],
        signature: "Aelys Vardane · Cartographe des chemins qui n’existent pas encore",
      },
      {
        id: "post-lanternes-2",
        author: rhydan,
        postedAt: "24 août 2026 · 22:02",
        content: [
          "Rhydan n’avait pas l’allure de quelqu’un qui cherchait une personne précise. Il marchait lentement, s’arrêtant devant les étals encore ouverts comme si chacun d’eux pouvait justifier sa présence.",
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent vitae mauris vitae tortor interdum malesuada. Lorsqu’il aperçut enfin Aelys, il ne modifia pas son pas. Seulement son regard.",
          "— On m’avait dit que tu poserais des questions. On avait oublié de préciser qu’elles seraient écrites sur du mauvais papier.",
        ],
        signature: "Rhydan Sorel · Une prudence qui ressemble parfois à de la mauvaise foi",
      },
      {
        id: "post-lanternes-3",
        author: nahla,
        postedAt: "25 août 2026 · 11:36",
        content: [
          "La voix de Nahla arriva avant elle, portée par un rire bref derrière l’épaule de Rhydan.",
          "— Et moi on m’avait dit qu’il y aurait quelque chose à boire. Je constate que les informations circulent de moins en moins bien dans cette ville.",
          "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium. Elle glissa une petite bourse sur la table sans s’asseoir, puis adressa à Aelys un regard beaucoup trop innocent pour être honnête.",
        ],
        signature: "Nahla Rahn · Marchande d’histoires, parfois avant même qu’elles arrivent",
      },
      {
        id: "post-lanternes-4",
        author: aelys,
        postedAt: "25 août 2026 · 16:28",
        content: [
          "Aelys observa successivement la bourse, Nahla, puis Rhydan. Ce n’était pas l’ordre logique, mais c’était celui que la soirée semblait réclamer.",
          "— Très bien. Nous avons donc un mauvais papier, aucune boisson et manifestement une bourse que personne ne souhaite expliquer. Pour une soirée qui devait être discrète, je trouve le début particulièrement prometteur.",
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec vitae lacus vitae sem tristique faucibus. Elle replia le feuillet et le rangea enfin. La piste pouvait attendre quelques minutes ; les ennuis, eux, venaient manifestement de s’asseoir à sa table.",
        ],
      },
    ],
  },
  {
    id: "topic-kugane",
    slug: "un-colis-au-marche-de-kugane",
    boardSlug: "roleplay-libre",
    title: "[Kugane] Un colis au marché du soir",
    excerpt: "Une petite scène ouverte autour d’un paquet livré à la mauvaise personne.",
    author: nahla,
    createdAt: "23 août 2026 · 18:42",
    lastActivity: "24 août 2026 · 10:11",
    replies: 6,
    views: 51,
    status: "finished",
    tags: ["RP libre", "Kugane", "Terminé"],
    posts: [],
  },
  {
    id: "topic-storyline-demo",
    slug: "les-echos-de-la-veille-acte-ii",
    boardSlug: "scenarios-fil-rouge",
    title: "Les Échos de la Veille — Acte II : sous la pierre froide",
    excerpt: "Sujet RP de démonstration associé à la chronique Les Échos de la Veille.",
    author: staff,
    createdAt: "22 août 2026 · 20:00",
    lastActivity: "25 août 2026 · 13:06",
    replies: 8,
    views: 74,
    pinned: true,
    status: "open",
    tags: ["Fil rouge", "Acte II", "Chronique"],
    posts: [],
  },
  {
    id: "topic-targeted-demo",
    slug: "aelys-rhydan-une-conversation-inachevee",
    boardSlug: "roleplay-cible",
    title: "Aelys & Rhydan — Une conversation inachevée",
    excerpt: "Scène ciblée de démonstration entre deux personnages liés dans le sociogramme.",
    author: rhydan,
    createdAt: "24 août 2026 · 19:20",
    lastActivity: "25 août 2026 · 15:44",
    replies: 2,
    views: 19,
    status: "open",
    tags: ["Ciblé", "Aelys", "Rhydan"],
    posts: [],
  },
];

export function getDemoTopicsForBoard(boardSlug: string) {
  return demoTopics.filter((topic) => topic.boardSlug === boardSlug);
}

export function getDemoTopic(boardSlug: string, topicSlug: string) {
  return demoTopics.find((topic) => topic.boardSlug === boardSlug && topic.slug === topicSlug);
}
