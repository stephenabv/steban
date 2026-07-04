import type { MetadataRoute } from "next";

export abstract class SitemapEntryProvider {
  abstract getEntries(): Promise<MetadataRoute.Sitemap> | MetadataRoute.Sitemap;
}
