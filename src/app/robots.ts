import type { MetadataRoute } from "next";
import { readSiteRuntimeSettings } from "@/lib/site-runtime";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://imetheran-community.vercel.app";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { maintenanceEnabled } = await readSiteRuntimeSettings();

  return {
    rules: maintenanceEnabled
      ? { userAgent: "*", disallow: "/" }
      : { userAgent: "*", allow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
