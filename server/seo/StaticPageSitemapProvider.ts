import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";
import { LEGAL_DOCUMENTS } from "@/config/legal";
import type { LegalDocumentKind, SeoPageKey } from "@/server/domain/entities";
import { SitemapEntryProvider, type SitemapContext } from "./SitemapEntryProvider";

/**
 * Last-significant-change dates for pages whose content has one. Google uses
 * <lastmod> only when it is "consistently and verifiably accurate", so pages
 * without a trustworthy date omit it rather than reporting the request time.
 */
export interface StaticPageDates {
  aboutUpdatedAt(): Promise<Date | null>;
  legalUpdatedAt(kind: LegalDocumentKind): Promise<Date | null>;
}

interface StaticPageDefinition {
  path: string;
  /** Admin SEO key; pages marked noindex there are left out. */
  seoKey?: SeoPageKey;
  lastModified?: (dates: StaticPageDates) => Promise<Date | null>;
}

const STATIC_PAGES: readonly StaticPageDefinition[] = [
  { path: "", seoKey: "home" },
  { path: "/about", seoKey: "about", lastModified: (dates) => dates.aboutUpdatedAt() },
  { path: "/contact", seoKey: "contact" },
  ...Object.values(LEGAL_DOCUMENTS).map((doc) => ({
    path: doc.path,
    lastModified: (dates: StaticPageDates) => dates.legalUpdatedAt(doc.kind),
  })),
];

/** Pages with a fixed route. The /projects index is listed by ProjectSitemapProvider. */
export class StaticPageSitemapProvider extends SitemapEntryProvider {
  constructor(private readonly dates: StaticPageDates) {
    super();
  }

  async getEntries({ indexing }: SitemapContext): Promise<MetadataRoute.Sitemap> {
    const pages = STATIC_PAGES.filter((page) => !page.seoKey || indexing.isIndexable(page.seoKey));
    return Promise.all(
      pages.map(async (page) => {
        const lastModified = page.lastModified ? await page.lastModified(this.dates) : null;
        return { url: siteUrl(page.path), ...(lastModified ? { lastModified } : {}) };
      })
    );
  }
}
