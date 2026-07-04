import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";

// robots.txt is a polite-crawler request, not access control — it must never
// name sensitive paths (they'd be advertised to anyone who reads it). Routes
// that shouldn't be indexed are excluded via the X-Robots-Tag response header
// instead (see server/security/robotsTag.ts), applied in proxy.ts.
export class RobotsService {
  static build(): MetadataRoute.Robots {
    return {
      rules: [{ userAgent: "*", allow: "/" }],
      sitemap: siteUrl("/sitemap.xml"),
    };
  }
}
