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

test.describe("social layout", () => {
  test("phones get the bottom tab bar and it never covers the page end", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const tabBar = page.locator("nav[data-tabbar]");
    await expect(tabBar).toBeVisible();
    await expect(tabBar.locator('a[aria-current="page"]')).toHaveAttribute("href", "/");
    await expect(tabBar.locator('a[href="/contact"]')).toBeVisible();

    // The body reserves the bar's height, so the footer's last line stays reachable.
    const padding = await page.evaluate(() => parseFloat(getComputedStyle(document.body).paddingBottom));
    const barHeight = await tabBar.evaluate((el) => el.getBoundingClientRect().height);
    expect(padding).toBeGreaterThanOrEqual(barHeight);
  });

  test("desktop uses the top tabs instead", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.locator("nav[data-tabbar]")).toBeHidden();
    await expect(page.getByRole("navigation", { name: "Main navigation" }).locator('a[href="/projects"]')).toBeVisible();
  });
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
