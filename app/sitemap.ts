import type { MetadataRoute } from "next";
import { getDefaultSitemapService } from "@/server/seo/SitemapService";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getDefaultSitemapService().build();
}
