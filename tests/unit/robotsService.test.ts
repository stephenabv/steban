import { describe, expect, it } from "vitest";
import { RobotsService } from "@/server/seo/RobotsService";
import { siteUrl } from "@/config/site";

describe("RobotsService.build", () => {
  const robots = RobotsService.build();
  const rule = Array.isArray(robots.rules) ? robots.rules[0] : robots.rules;

  it("keeps API and admin endpoints out of the crawl", () => {
    expect(rule.disallow).toEqual(["/api/", "/admin$", "/admin/"]);
    expect(rule.allow).toBe("/");
  });

  it("never names a configured secret admin route", () => {
    process.env.sudo_route = "panel-x9";
    try {
      expect(JSON.stringify(RobotsService.build())).not.toContain("panel-x9");
    } finally {
      delete process.env.sudo_route;
    }
  });

  it("points crawlers at the sitemap on the canonical host", () => {
    expect(robots.sitemap).toBe(siteUrl("/sitemap.xml"));
  });
});
