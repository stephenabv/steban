import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";
import type { Project } from "@/server/domain/entities";
import { SitemapEntryProvider, type SitemapContext } from "./SitemapEntryProvider";
import { sitemapUrl } from "./sitemapXml";

export type SitemapProject = Pick<Project, "slug" | "updatedAt" | "coverImage" | "gallery">;

/** Loads every published project, or null when storage is unavailable. */
export type ProjectSource = () => Promise<readonly SitemapProject[] | null>;

/**
 * The /projects index and one entry per project, with its cover and gallery
 * as image-sitemap entries so they can surface in Google Images.
 */
export class ProjectSitemapProvider extends SitemapEntryProvider {
  constructor(private readonly loadProjects: ProjectSource) {
    super();
  }

  async getEntries({ indexing }: SitemapContext): Promise<MetadataRoute.Sitemap> {
    const projects = (await this.loadProjects()) ?? [];
    const entries: MetadataRoute.Sitemap = [];

    if (indexing.isIndexable("projects")) {
      const latest = ProjectSitemapProvider.latestUpdate(projects);
      entries.push({ url: siteUrl("/projects"), ...(latest ? { lastModified: latest } : {}) });
    }

    for (const project of projects) {
      const images = ProjectSitemapProvider.images(project);
      entries.push({
        url: siteUrl(`/projects/${encodeURIComponent(project.slug)}`),
        lastModified: project.updatedAt,
        ...(images.length > 0 ? { images } : {}),
      });
    }
    return entries;
  }

  private static latestUpdate(projects: readonly SitemapProject[]): Date | null {
    let latest: Date | null = null;
    for (const { updatedAt } of projects) {
      if (!latest || updatedAt > latest) latest = updatedAt;
    }
    return latest;
  }

  private static images(project: SitemapProject): string[] {
    const urls = [project.coverImage, ...project.gallery]
      .filter(Boolean)
      .map(sitemapUrl)
      .filter((url): url is string => url !== null);
    return [...new Set(urls)];
  }
}
