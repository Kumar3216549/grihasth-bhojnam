import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const base: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/menu`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/plans`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/order`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ];
  try {
    const areas = await db.area.findMany({ where: { active: true }, select: { slug: true } });
    return [...base, ...areas.map((a) => ({ url: `${SITE_URL}/tiffin-service/${a.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 }))];
  } catch {
    return base;
  }
}
