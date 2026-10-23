import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";

/**
 * Paths with nothing for search engines: JSON endpoints and the default admin
 * entry point. Disallowing them saves crawl budget and keeps "Blocked by
 * noindex" / "Redirect" entries out of Search Console's page indexing report.
 *
 * robots.txt is public and is not access control: every admin page and API
 * re-checks the session server-side, and these paths also carry
 * `X-Robots-Tag: noindex` (server/security/robotsTag.ts). The configured
 * `sudo_route` is deliberately never listed here, because naming it would
 * advertise the secret admin URL to anyone who reads this file.
 */
export const DISALLOWED_PATHS = ["/api/", "/admin$", "/admin/"] as const;

export class RobotsService {
  static build(): MetadataRoute.Robots {
    return {
      rules: [{ userAgent: "*", allow: "/", disallow: [...DISALLOWED_PATHS] }],
      sitemap: siteUrl("/sitemap.xml"),
    };
  }
}
