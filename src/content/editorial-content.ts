export type PublicationStatus = "draft" | "scheduled" | "published" | "archived";

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
      "https://www.rpgfan.com/wp-content/uploads/2023/07/Final-Fantasy-XIV-Dawntrail-Screenshot-078.webp",
    highlights: ["Vie communautaire", "Carnet rôleplay", "Cuisine & curiosités"],
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
