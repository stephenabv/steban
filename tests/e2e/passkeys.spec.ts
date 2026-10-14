import { expect, test } from "@playwright/test";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { PasskeysPage, addVirtualAuthenticator } from "./pages/PasskeysPage";
import { E2E_ADMIN } from "./support/e2eEnv";

const PASSKEY_NAME = `E2E key ${Date.now()}`;

test.describe("passkeys", () => {
  test("adds a passkey, signs in with it and removes it", async ({ page }) => {
    await addVirtualAuthenticator(page);
    const login = new AdminLoginPage(page);
    const passkeys = new PasskeysPage(page);

    // A fresh password sign-in: adding a passkey needs a recent sign-in.
    await login.goto();
    await login.signIn(E2E_ADMIN.username, E2E_ADMIN.password);
    await expect(page).toHaveURL(/\/admin\/?$/);

    await passkeys.goto();
    await passkeys.name.fill(PASSKEY_NAME);
    await passkeys.add.click();
    await expect(passkeys.item(PASSKEY_NAME)).toContainText("Never used");

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/admin\/login/);

    await page.goto("/admin/login?callbackUrl=%2Fadmin%2Fpasskeys");
    await page.getByRole("button", { name: "Sign in with a passkey" }).click();
    await expect(page).toHaveURL(/\/admin\/passkeys$/);
    await expect(passkeys.item(PASSKEY_NAME)).toContainText("Last used");

    await passkeys.remove(PASSKEY_NAME);
    await expect(page.getByText("No passkeys yet")).toBeVisible();
  });

  test("lays out without horizontal scrolling on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin/login");
    await expect(page.getByRole("button", { name: "Sign in with a passkey" })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("rejects a sign-in without a pending challenge", async ({ request, baseURL }) => {
    const response = await request.post("/api/auth/passkey/verify", {
      headers: { origin: baseURL! },
      data: {
        response: {
          id: "abc",
          rawId: "abc",
          type: "public-key",
          clientExtensionResults: {},
          response: { clientDataJSON: "abc", authenticatorData: "abc", signature: "abc" },
        },
      },
    });
    expect(response.status()).toBe(400);
    expect(response.headers()["cache-control"]).toContain("no-store");
  });

  test("refuses registration without a session", async ({ request, baseURL }) => {
    const response = await request.post("/api/admin/passkeys/options", {
      headers: { origin: baseURL! },
    });
    expect(response.status()).toBe(401);
  });
});
