import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getProjectService } from "@/server/services";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/projects`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  const result = await getProjectService().getAll({ pageSize: 100 });
  const projectEntries: MetadataRoute.Sitemap = result.ok
    ? result.value.items.map((p) => ({
        url: `${base}/projects/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.8,
      }))
    : [];

  return [...staticEntries, ...projectEntries];
}
