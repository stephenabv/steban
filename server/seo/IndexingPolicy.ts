import type { SeoMetadata, SeoPageKey } from "@/server/domain/entities";

/**
 * Which admin-editable pages search engines may index. A page the admin marked
 * "noindex" must also be left out of the sitemap: Search Console reports
 * "Submitted URL marked noindex" for a URL that is listed but blocked.
 */
export class IndexingPolicy {
  static readonly ALLOW_ALL = new IndexingPolicy(new Set());

  private constructor(private readonly noIndexPages: ReadonlySet<string>) {}

  static fromSeoEntries(
    entries: readonly Pick<SeoMetadata, "pageKey" | "noIndex">[]
  ): IndexingPolicy {
    return new IndexingPolicy(
      new Set(entries.filter((entry) => entry.noIndex).map((entry) => entry.pageKey))
    );
  }

  isIndexable(pageKey: SeoPageKey): boolean {
    return !this.noIndexPages.has(pageKey);
  }
}
