import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";
import { getProjectService } from "@/server/services";
import { SitemapEntryProvider } from "./SitemapEntryProvider";

export class ProjectSitemapProvider extends SitemapEntryProvider {
  async getEntries(): Promise<MetadataRoute.Sitemap> {
    const result = await getProjectService().getAll({ pageSize: 100 });
    if (!result.ok) return [];

    return result.value.items.map((project) => ({
      url: siteUrl(`/projects/${project.slug}`),
      lastModified: project.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));
  }
}
