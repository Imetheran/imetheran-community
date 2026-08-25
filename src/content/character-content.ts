export type CharacterVisibility = "public" | "unlisted" | "private";
export type CharacterStatus = "active" | "inactive" | "archived";

export type CharacterHook = {
  title: string;
  text: string;
};

export type CharacterRelation = {
  name: string;
  relation: string;
  note: string;
};

export type CharacterActivity = {
  type: "chronicle" | "forum" | "event";
  title: string;
  meta: string;
};

export type CharacterProfile = {
  id: string;
  slug: string;
  displayName: string;
  initials: string;
  epithet: string;
  summary: string;
  featured: boolean;
  visibility: CharacterVisibility;
  status: CharacterStatus;
  world: string;
  people: string;
  age: string;
  origin: string;
  residence: string;
  occupation: string;
  affiliation: string;
  quote: string;
  traits: string[];
  biography: string[];
  hooks: CharacterHook[];
  relations: CharacterRelation[];
  activity: CharacterActivity[];
};

export const characters: CharacterProfile[] = [
  {
    id: "character-demo-aelys",
    slug: "aelys-vardane",
    displayName: "Aelys Vardane",
    initials: "AV",
    epithet: "Cartographe des chemins oubliés",
    summary:
      "Voyageuse méthodique, collectionneuse de cartes incomplètes et messagère lorsqu’une route mérite d’être parcourue deux fois.",
    featured: true,
    visibility: "public",
    status: "active",
    world: "Moogle",
    people: "Hyur",
    age: "28 ans",
    origin: "Ul'dah",
    residence: "Tuliyollal",
    occupation: "Cartographe & messagère",
    affiliation: "Indépendante",
    quote: "Une carte ne montre jamais où l’on hésitera.",
    traits: ["Curieuse", "Pragmatique", "Observatrice", "Difficile à impressionner"],
    biography: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer interdum, risus sed posuere malesuada, nibh lectus viverra libero, vitae pellentesque risus neque at ipsum.",
      "Praesent vitae tristique erat. Donec luctus, lacus vitae accumsan luctus, purus magna tristique tortor, sed pretium arcu massa non augue. Nulla facilisi. Mauris vitae velit at nibh pretium tincidunt.",
      "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium. Suspendisse varius nibh vitae nibh placerat, ut feugiat justo faucibus.",
    ],
    hooks: [
      {
        title: "Une carte qui ne devrait pas exister",
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Un itinéraire annoté dans une main inconnue pourrait suffire à provoquer une rencontre.",
      },
      {
        title: "Courrier en retard",
        text: "Aelys accepte parfois de porter des messages lorsque la destination l’intéresse davantage que la récompense.",
      },
      {
        title: "Mémoire des routes",
        text: "Elle conserve des notes sur les lieux traversés et pourrait reconnaître un détail qu’un autre personnage croyait insignifiant.",
      },
    ],
    relations: [
      {
        name: "Personnage B",
        relation: "Confiance prudente",
        note: "Une relation de démonstration destinée au futur sociogramme.",
      },
      {
        name: "Personnage C",
        relation: "Dette ancienne",
        note: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      },
      {
        name: "À définir",
        relation: "Lien ouvert",
        note: "Emplacement libre pour illustrer les relations à créer avec d’autres membres.",
      },
    ],
    activity: [
      {
        type: "chronicle",
        title: "Les Échos de la Veille",
        meta: "Chronique de démonstration · participante",
      },
      {
        type: "forum",
        title: "Une lettre arrivée trop tard",
        meta: "Sujet RP de démonstration",
      },
      {
        type: "event",
        title: "Rencontre au marché",
        meta: "Événement de démonstration",
      },
    ],
  },
  {
    id: "character-demo-rhydan",
    slug: "rhydan-sorel",
    displayName: "Rhydan Sorel",
    initials: "RS",
    epithet: "Main calme, regard inquiet",
    summary:
      "Ancien convoyeur devenu homme à tout faire, plus à l’aise avec les problèmes concrets qu’avec les questions sans réponse.",
    featured: false,
    visibility: "public",
    status: "active",
    world: "Moogle",
    people: "Hyur",
    age: "34 ans",
    origin: "Limsa Lominsa",
    residence: "Itinérant",
    occupation: "Convoyeur",
    affiliation: "Indépendant",
    quote: "On peut toujours réparer quelque chose. Parfois ce n’est simplement pas ce qu’on pensait.",
    traits: ["Patient", "Loyal", "Taciturne"],
    biography: ["Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum vitae neque sit amet nibh egestas vulputate."],
    hooks: [{ title: "Anciennes routes", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." }],
    relations: [],
    activity: [],
  },
  {
    id: "character-demo-nahla",
    slug: "nahla-rahn",
    displayName: "Nahla Rahn",
    initials: "NR",
    epithet: "Une histoire pour chaque table",
    summary:
      "Conteuse ambulante qui échange volontiers une anecdote contre un repas, et un secret contre une meilleure histoire.",
    featured: false,
    visibility: "public",
    status: "active",
    world: "Moogle",
    people: "Miqo'te",
    age: "26 ans",
    origin: "Gridania",
    residence: "Tuliyollal",
    occupation: "Conteuse",
    affiliation: "Indépendante",
    quote: "Une bonne histoire n’a pas besoin d’être vraie. Elle doit seulement savoir pourquoi elle est racontée.",
    traits: ["Sociable", "Malicieuse", "Perspicace"],
    biography: ["Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus vel dui ac arcu consequat ultrices."],
    hooks: [{ title: "Histoires contre histoires", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." }],
    relations: [],
    activity: [],
  },
];

export const featuredCharacter =
  characters.find((character) => character.featured && character.visibility === "public") ?? characters[0];

export function getCharacterBySlug(slug: string) {
  return characters.find((character) => character.slug === slug && character.visibility === "public");
}
