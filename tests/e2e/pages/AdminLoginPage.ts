import type { Locator, Page } from "@playwright/test";

export class AdminLoginPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly submit: Locator;

  constructor(private readonly page: Page) {
    this.username = page.getByLabel("Username");
    this.password = page.getByLabel("Password", { exact: true });
    this.submit = page.getByRole("button", { name: "Sign in" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/admin/login");
  }

  async signIn(username: string, password: string): Promise<void> {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.submit.click();
  }
}
