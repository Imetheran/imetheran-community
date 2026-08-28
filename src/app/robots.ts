import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://imetheran-community.vercel.app";

export default function robots(): MetadataRoute.Robots {
  const maintenanceEnabled = process.env.MAINTENANCE_MODE?.toLowerCase() === "true";

  return {
    rules: maintenanceEnabled
      ? { userAgent: "*", disallow: "/" }
      : { userAgent: "*", allow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
