import type { MetadataRoute } from "next";
import type { SitemapEntryProvider } from "./SitemapEntryProvider";
import { StaticPageSitemapProvider } from "./StaticPageSitemapProvider";
import { ProjectSitemapProvider } from "./ProjectSitemapProvider";

export class SitemapService {
  constructor(private readonly providers: SitemapEntryProvider[]) {}

  async build(): Promise<MetadataRoute.Sitemap> {
    const entries = await Promise.all(this.providers.map((provider) => provider.getEntries()));
    return entries.flat();
  }
}

export function getDefaultSitemapService(): SitemapService {
  return new SitemapService([new StaticPageSitemapProvider(), new ProjectSitemapProvider()]);
}
