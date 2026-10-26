import { expect, test, type Page } from "@playwright/test";

/** Parsed JSON-LD blocks in the server-rendered HTML. */
async function structuredData(page: Page): Promise<Record<string, unknown>[]> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.map((text) => JSON.parse(text) as Record<string, unknown>);
}

test.describe("crawlability", () => {
  test("robots.txt allows crawling and points at the sitemap", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.ok()).toBe(true);
    const body = await response.text();
    expect(body).toContain("Allow: /");
    expect(body).toMatch(/^Sitemap: https?:\/\/\S+\/sitemap\.xml$/m);
    expect(body).not.toContain("/admin");
  });

  test("sitemap.xml is well-formed and lists only canonical public pages", async ({
    page,
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.ok()).toBe(true);
    const xml = await response.text();

    const parsed = await page.evaluate((source) => {
      const doc = new DOMParser().parseFromString(source, "application/xml");
      return {
        error: doc.getElementsByTagName("parsererror").length > 0,
        locs: Array.from(doc.getElementsByTagName("loc"), (node) => node.textContent ?? ""),
      };
    }, xml);

    expect(parsed.error).toBe(false);
    const paths = parsed.locs.map((loc) => new URL(loc).pathname);
    expect(paths).toEqual(
      expect.arrayContaining(["/", "/about", "/contact", "/projects", "/privacy", "/terms"])
    );
    expect(paths.some((path) => path.startsWith("/admin") || path.startsWith("/api"))).toBe(false);
    // Google ignores both; they only add bytes.
    expect(xml).not.toContain("<priority>");
    expect(xml).not.toContain("<changefreq>");
  });

  // Google only honours rel="canonical" in the <head> of the served HTML, and
  // Googlebot's user agent is not one Next.js sends blocking metadata to by default.
  for (const path of ["/", "/about", "/contact", "/projects", "/privacy", "/terms"]) {
    test(`${path} declares its canonical URL in the served <head>`, async ({ request }) => {
      const response = await request.get(path, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        },
      });
      expect(response.ok()).toBe(true);
      const head = (await response.text()).split("</head>")[0];
      const canonical = head.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
      expect(canonical, "canonical link inside <head>").toBeDefined();
      expect(new URL(canonical!).pathname.replace(/\/$/, "")).toBe(path.replace(/\/$/, ""));
    });
  }

  test("the IndexNow key file is absent when no key is configured", async ({ request }) => {
    const response = await request.get("/indexnow-key.txt");
    expect(response.status()).toBe(404);
  });

  test("admin pages are kept out of the index by header", async ({ request }) => {
    const response = await request.get("/admin/login");
    expect(response.headers()["x-robots-tag"]).toBe("noindex, nofollow");
  });
});

test.describe("structured data", () => {
  test("home describes the site and its owner", async ({ page }) => {
    await page.goto("/");
    const types = (await structuredData(page)).map((block) => block["@type"]);
    expect(types).toEqual(expect.arrayContaining(["Person", "WebSite"]));
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /^https?:\/\/[^/]+\/?$/
    );
  });

  test("about is a ProfilePage with a breadcrumb", async ({ page }) => {
    await page.goto("/about");
    const blocks = await structuredData(page);
    const profile = blocks.find((block) => block["@type"] === "ProfilePage");
    expect(profile).toMatchObject({ mainEntity: { "@type": "Person", name: "Stephen Abueva" } });
    expect(blocks.some((block) => block["@type"] === "BreadcrumbList")).toBe(true);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/about$/);
  });
});
