import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://imetheran-community.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "", priority: 1, changeFrequency: "daily" as const },
    { path: "/forum", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/chroniques", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/gazettes", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/guides", priority: 0.7, changeFrequency: "weekly" as const },
    { path: "/personnages", priority: 0.7, changeFrequency: "daily" as const },
    { path: "/liens", priority: 0.6, changeFrequency: "weekly" as const },
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
