import { expect, test } from "@playwright/test";

const SAMPLE_ID = "6f1c1a52-6a0e-4f0c-9d2f-0c4b7b0d6a11";

test.describe("without a session", () => {
  for (const path of [
    "/admin/cover-letters",
    "/admin/cover-letters/new",
    `/admin/cover-letters/${SAMPLE_ID}`,
  ]) {
    test(`redirects ${path} to the login page`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin\/login\?callbackUrl=/);
      await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    });
  }

  test("refuses the export endpoint", async ({ request }) => {
    const response = await request.get(`/api/admin/cover-letters/${SAMPLE_ID}/export?format=pdf`);
    expect(response.status()).toBe(401);
    expect(response.headers()["cache-control"]).toContain("no-store");
  });
});
