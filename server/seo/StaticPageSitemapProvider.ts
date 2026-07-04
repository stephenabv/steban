import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";
import { SitemapEntryProvider } from "./SitemapEntryProvider";

interface StaticPageDefinition {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
}

const STATIC_PAGES: StaticPageDefinition[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/projects", changeFrequency: "weekly", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
];

export class StaticPageSitemapProvider extends SitemapEntryProvider {
  getEntries(): MetadataRoute.Sitemap {
    const now = new Date();
    return STATIC_PAGES.map((page) => ({
      url: siteUrl(page.path),
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    }));
  }
}
