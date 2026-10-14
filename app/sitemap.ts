import type { MetadataRoute } from "next";
import { getDefaultSitemapService } from "@/server/seo/sitemapService.instance";

// Regenerated at most hourly so new or edited projects reach the sitemap without
// a redeploy; without this the file is prerendered once at build time.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getDefaultSitemapService().build();
}
