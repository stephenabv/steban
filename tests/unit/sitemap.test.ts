import { describe, expect, it } from "vitest";
import { siteUrl } from "@/config/site";
import { IndexingPolicy } from "@/server/seo/IndexingPolicy";
import { ProjectSitemapProvider, type SitemapProject } from "@/server/seo/ProjectSitemapProvider";
import { SitemapService } from "@/server/seo/SitemapService";
import {
  StaticPageSitemapProvider,
  type StaticPageDates,
} from "@/server/seo/StaticPageSitemapProvider";
import { sitemapUrl, xmlEscape } from "@/server/seo/sitemapXml";

const ABOUT_UPDATED = new Date("2026-09-01T10:00:00Z");
const PRIVACY_EFFECTIVE = new Date("2026-05-01T00:00:00Z");
const TERMS_EFFECTIVE = new Date("2026-05-02T00:00:00Z");

const dates: StaticPageDates = {
  aboutUpdatedAt: async () => ABOUT_UPDATED,
  legalUpdatedAt: async (kind) => (kind === "privacy" ? PRIVACY_EFFECTIVE : TERMS_EFFECTIVE),
};

const project = (overrides: Partial<SitemapProject> = {}): SitemapProject => ({
  slug: "alpha",
  updatedAt: new Date("2026-08-01T00:00:00Z"),
  coverImage: "",
  gallery: [],
  ...overrides,
});

function service(
  projects: SitemapProject[] | null,
  policy: IndexingPolicy | null = IndexingPolicy.ALLOW_ALL
) {
  return new SitemapService(
    [new StaticPageSitemapProvider(dates), new ProjectSitemapProvider(async () => projects)],
    async () => policy
  );
}

describe("SitemapService", () => {
  it("lists every public page with accurate lastmod and no changefreq/priority", async () => {
    const entries = await service([project()]).build();

    expect(entries).toEqual([
      { url: siteUrl() },
      { url: siteUrl("/about"), lastModified: ABOUT_UPDATED },
      { url: siteUrl("/contact") },
      { url: siteUrl("/privacy"), lastModified: PRIVACY_EFFECTIVE },
      { url: siteUrl("/terms"), lastModified: TERMS_EFFECTIVE },
      { url: siteUrl("/projects"), lastModified: new Date("2026-08-01T00:00:00Z") },
      { url: siteUrl("/projects/alpha"), lastModified: new Date("2026-08-01T00:00:00Z") },
    ]);
  });

  it("dates the projects index by its most recently updated project", async () => {
    const entries = await service([
      project({ slug: "old", updatedAt: new Date("2025-01-01T00:00:00Z") }),
      project({ slug: "new", updatedAt: new Date("2026-10-01T00:00:00Z") }),
    ]).build();

    expect(entries.find((e) => e.url === siteUrl("/projects"))?.lastModified).toEqual(
      new Date("2026-10-01T00:00:00Z")
    );
  });

  it("leaves out pages the admin marked noindex", async () => {
    const policy = IndexingPolicy.fromSeoEntries([
      { pageKey: "contact", noIndex: true },
      { pageKey: "projects", noIndex: true },
      { pageKey: "about", noIndex: false },
    ]);
    const urls = (await service([project()], policy).build()).map((e) => e.url);

    expect(urls).not.toContain(siteUrl("/contact"));
    expect(urls).not.toContain(siteUrl("/projects"));
    expect(urls).toContain(siteUrl("/about"));
    expect(urls).toContain(siteUrl("/projects/alpha"));
  });

  it("falls back to indexing everything when SEO settings can't be read", async () => {
    const urls = (await service([], null).build()).map((e) => e.url);
    expect(urls).toContain(siteUrl("/contact"));
    expect(urls).toContain(siteUrl("/projects"));
  });

  it("still lists static pages when projects can't be loaded", async () => {
    const entries = await service(null).build();
    expect(entries.map((e) => e.url)).toContain(siteUrl("/about"));
    expect(entries.find((e) => e.url === siteUrl("/projects"))).toEqual({
      url: siteUrl("/projects"),
    });
  });
});

describe("ProjectSitemapProvider images", () => {
  it("adds cover and gallery images, escaped for XML and de-duplicated", async () => {
    const provider = new ProjectSitemapProvider(async () => [
      project({
        coverImage: "https://cdn.example.com/cover.png?w=1200&q=80",
        gallery: [
          "https://cdn.example.com/cover.png?w=1200&q=80",
          "https://cdn.example.com/shot.png",
          "/relative.png",
          "javascript:alert(1)",
        ],
      }),
    ]);
    const entries = await provider.getEntries({ indexing: IndexingPolicy.ALLOW_ALL });

    expect(entries.find((e) => e.url === siteUrl("/projects/alpha"))?.images).toEqual([
      "https://cdn.example.com/cover.png?w=1200&amp;q=80",
      "https://cdn.example.com/shot.png",
    ]);
  });

  it("omits the images field when a project has none", async () => {
    const provider = new ProjectSitemapProvider(async () => [project()]);
    const entries = await provider.getEntries({ indexing: IndexingPolicy.ALLOW_ALL });
    expect(entries[1]).not.toHaveProperty("images");
  });
});

describe("sitemap XML helpers", () => {
  it("escapes the five XML special characters", () => {
    expect(xmlEscape(`a&b<c>d"e'f`)).toBe("a&amp;b&lt;c&gt;d&quot;e&apos;f");
  });

  it("accepts only absolute http(s) URLs", () => {
    expect(sitemapUrl(" https://example.com/a b ")).toBe("https://example.com/a%20b");
    expect(sitemapUrl("data:image/png;base64,AAAA")).toBeNull();
    expect(sitemapUrl("not a url")).toBeNull();
    expect(sitemapUrl("https://cdn.example.com/logo?poi={$this.metadata.x}")).toBeNull();
  });
});

describe("IndexingPolicy", () => {
  it("allows everything unless a page is marked noindex", () => {
    const policy = IndexingPolicy.fromSeoEntries([{ pageKey: "home", noIndex: true }]);
    expect(policy.isIndexable("home")).toBe(false);
    expect(policy.isIndexable("about")).toBe(true);
    expect(IndexingPolicy.ALLOW_ALL.isIndexable("home")).toBe(true);
  });
});
