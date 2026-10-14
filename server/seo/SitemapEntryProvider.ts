import type { MetadataRoute } from "next";
import type { IndexingPolicy } from "./IndexingPolicy";

export interface SitemapContext {
  indexing: IndexingPolicy;
}

export abstract class SitemapEntryProvider {
  abstract getEntries(context: SitemapContext): Promise<MetadataRoute.Sitemap> | MetadataRoute.Sitemap;
}
