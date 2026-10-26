import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const CUSTOM = "#12ab34";

async function htmlGradient(page: Page, property: string): Promise<string> {
  return page.evaluate((name) => document.documentElement.style.getPropertyValue(name), property);
}

async function save(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Save gradient" }).click();
  await expect(page.getByText("Gradient saved.")).toBeVisible();
}

test.describe("appearance", () => {
  test("applies a saved gradient to every public gradient surface, server-rendered", async ({ page, request }) => {
    await page.goto("/admin/appearance");
    await page.getByLabel("Colour 1", { exact: true }).fill(CUSTOM);
    await save(page);

    // Present in the HTML itself, before any script runs: no flash on load.
    const html = await (await request.get("/")).text();
    expect(html).toContain(CUSTOM);

    await page.goto("/");
    expect(await htmlGradient(page, "--gradient-ig")).toContain(CUSTOM);
    expect(await htmlGradient(page, "--gradient-rule")).toContain(CUSTOM);
    expect(await htmlGradient(page, "--gradient-cover")).toContain(CUSTOM);
  });

  test("rejects a colour that is not hex", async ({ page }) => {
    await page.goto("/admin/appearance");
    await page.getByLabel("Colour 2", { exact: true }).fill("red");
    await page.getByRole("button", { name: "Save gradient" }).click();
    await expect(page.getByText("Use a hex colour such as #d62976.")).toBeVisible();
  });

  test("resets to the default palette", async ({ page }) => {
    await page.goto("/admin/appearance");
    await page.getByRole("button", { name: "Reset to default" }).click();
    await save(page);

    await page.goto("/");
    expect(await htmlGradient(page, "--gradient-cover")).toContain("#0866ff");
  });

  test("keeps the editor within a 390px phone screen", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin/appearance");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
