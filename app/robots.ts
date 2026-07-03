import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getAdminBasePath } from "@/lib/adminRoute";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [`${getAdminBasePath()}/`, "/api/"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
