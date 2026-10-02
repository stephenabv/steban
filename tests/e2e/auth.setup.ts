import { expect, test as setup } from "@playwright/test";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { E2E_ADMIN, STORAGE_STATE } from "./support/e2eEnv";

setup("sign in as the admin", async ({ page }) => {
  const login = new AdminLoginPage(page);
  await login.goto();
  await login.signIn(E2E_ADMIN.username, E2E_ADMIN.password);
  await expect(page).toHaveURL(/\/admin\/?$/);
  await page.context().storageState({ path: STORAGE_STATE });
});
