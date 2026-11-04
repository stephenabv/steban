import { expect, test, type Page } from "@playwright/test";

/** Name of the CSS animation currently applied to the public route wrapper. */
function routeAnimation(page: Page): Promise<string> {
  return page.locator(".route-page").first().evaluate((el) => getComputedStyle(el).animationName);
}

test.describe("home page performance guards", () => {
  test("the hero is painted without waiting for the JavaScript bundle", async ({ page }) => {
    // Block the app's script chunks: the server-rendered hero must not depend on hydration.
    await page.route("**/_next/static/chunks/*.js", (route) => route.abort());
    await page.goto("/");

    const heading = page.locator("#hero-heading");
    await expect(heading).toBeVisible();
    // The CSS entrance animation finishes on its own; nothing holds the copy at opacity 0.
    await expect.poll(() => heading.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
  });

  test("the route fade runs on navigations but not on the initial load", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveAttribute("data-route-transitions");
    expect(await routeAnimation(page)).toBe("none");

    await page.locator('header a[href="/projects"]').first().click();
    await page.waitForURL("**/projects");
    await expect(page.locator("html")).toHaveAttribute("data-route-transitions", "");
    await expect.poll(() => routeAnimation(page)).toBe("route-page-enter");
  });

  test("the footer stays out of flow while a route loading fallback is up", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("body > footer");
    await expect(footer).toBeVisible();

    await page.evaluate(() => {
      const fallback = document.createElement("div");
      fallback.setAttribute("data-route-loader", "");
      fallback.id = "fake-route-loader";
      document.querySelector("main")?.append(fallback);
    });
    await expect(footer).toBeHidden();

    await page.evaluate(() => document.getElementById("fake-route-loader")?.remove());
    await expect(footer).toBeVisible();
  });
});

test.describe("HUD layout", () => {
  test("phones put the section tabs in an equal-width row under the bar", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const nav = page.getByRole("navigation", { name: "Main navigation" });
    const tabs = nav.locator("a");
    await expect(tabs).toHaveCount(3);
    await expect(nav.locator('a[aria-current="page"]')).toHaveAttribute("href", "/");
    await expect(page.locator('header a[href="/contact"]')).toBeVisible();

    const widths = await tabs.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width));
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);

    // Content starts below the two-row header, never under it.
    const headerBottom = await page.locator("body > header").evaluate((el) => el.getBoundingClientRect().bottom);
    const heroTop = await page.locator("#hero-heading").evaluate((el) => el.getBoundingClientRect().top);
    expect(heroTop).toBeGreaterThan(headerBottom);
  });

  test("phone panels keep a side gutter and nothing scrolls sideways", async ({ page }) => {
    const width = 390;
    const gutter = 16;
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(width);

    // The hero panel, every featured project card and the closing call to action.
    const panels = page.locator('section[aria-labelledby="hero-heading"] > *, #featured article, section:has(#cta-heading) > *');
    const count = await panels.count();
    expect(count).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < count; i++) {
      const box = await panels.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(gutter);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width - gutter);
    }
  });

  test("stacked call-to-action buttons share one width on phones", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const buttons = page.locator("section:has(#cta-heading) a");
    const widths = await buttons.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width));
    expect(widths.length).toBeGreaterThanOrEqual(1);
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);
  });

  test("desktop shows the tabs in one row with the logo and contact button", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    const logo = page.locator('header a[href="/"]').first();
    const navBox = await nav.boundingBox();
    const logoBox = await logo.boundingBox();
    expect(navBox && logoBox && Math.abs(navBox.y + navBox.height / 2 - (logoBox.y + logoBox.height / 2))).toBeLessThan(4);
    await expect(nav.locator('a[href="/projects"]')).toBeVisible();
  });

  test("the site is dark only, with no theme toggle", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /theme|dark mode|light mode/i })).toHaveCount(0);
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#050706");
  });

  for (const width of [390, 1024, 1440, 1920]) {
    test(`background tech glyphs stay decorative and out of the content column at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/about");
      await expect(page.locator("#main-content h1")).toBeVisible();

      const backdrop = page.locator("[data-tech-backdrop]");
      await expect(backdrop).toHaveAttribute("aria-hidden", "true");
      const layer = await backdrop.evaluate((el) => {
        const style = getComputedStyle(el);
        return { position: style.position, zIndex: style.zIndex, pointerEvents: style.pointerEvents };
      });
      expect(layer).toEqual({ position: "fixed", zIndex: "-1", pointerEvents: "none" });

      // Every visible glyph must end before the page heading's column starts
      // (left side) or begin after the content column ends (right side).
      const overlaps = await page.evaluate(() => {
        const heading = document.querySelector("#main-content h1");
        if (!heading) return ["no page heading"];
        const contentLeft = heading.getBoundingClientRect().left;
        const contentRight = document.documentElement.clientWidth - contentLeft;
        return [...document.querySelectorAll<HTMLElement>("[data-tech-backdrop] > *")]
          .filter((el) => getComputedStyle(el).display !== "none")
          .map((el) => ({ side: el.dataset.side, box: el.getBoundingClientRect() }))
          .filter(({ side, box }) => (side === "left" ? box.right > contentLeft : box.left < contentRight))
          .map(({ side, box }) => `${side} glyph at ${Math.round(box.left)}-${Math.round(box.right)}`);
      });
      expect(overlaps).toEqual([]);
    });
  }
});

test.describe("navigation scroll", () => {
  /** Samples scrollY for a while after a navigation, to catch a late smooth scroll. */
  async function settledScroll(page: Page): Promise<number[]> {
    const samples: number[] = [];
    for (let i = 0; i < 8; i++) {
      samples.push(await page.evaluate(() => Math.round(window.scrollY)));
      await page.waitForTimeout(125);
    }
    return samples;
  }

  test("a page change lands on the top of the new page, not its closing call to action", async ({ page }) => {
    await page.goto("/");
    await page.locator('header nav[aria-label="Main navigation"] a[href="/projects"]').first().click();
    await page.waitForURL("**/projects");
    expect(await settledScroll(page)).toEqual(Array(8).fill(0));

    // From the bottom of a page too: the footer link must not leave us near the end.
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
    await page.locator('footer a[href="/about"]').click();
    await page.waitForURL("**/about");
    expect((await settledScroll(page)).every((y) => y === 0)).toBe(true);
  });
});
