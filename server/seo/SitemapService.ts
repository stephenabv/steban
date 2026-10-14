import type { MetadataRoute } from "next";
import type { SitemapEntryProvider } from "./SitemapEntryProvider";
import { IndexingPolicy } from "./IndexingPolicy";

/** Loads the admin noindex settings; null when storage is unavailable. */
export type IndexingPolicySource = () => Promise<IndexingPolicy | null>;

export class SitemapService {
  constructor(
    private readonly providers: readonly SitemapEntryProvider[],
    private readonly loadIndexingPolicy: IndexingPolicySource = async () => IndexingPolicy.ALLOW_ALL
  ) {}

  async build(): Promise<MetadataRoute.Sitemap> {
    // Pages fall back to indexable metadata when SEO settings can't be read,
    // so the sitemap falls back the same way and the two never disagree.
    const indexing = (await this.loadIndexingPolicy()) ?? IndexingPolicy.ALLOW_ALL;
    const entries = await Promise.all(this.providers.map((provider) => provider.getEntries({ indexing })));
    return entries.flat();
  }
}
