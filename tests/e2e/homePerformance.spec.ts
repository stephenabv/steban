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
