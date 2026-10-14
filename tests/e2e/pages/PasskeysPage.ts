import type { CDPSession, Locator, Page } from "@playwright/test";

/**
 * Chromium's virtual authenticator: a platform authenticator that stores
 * discoverable credentials and approves user verification automatically.
 */
export async function addVirtualAuthenticator(page: Page): Promise<CDPSession> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  await cdp.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport: "internal",
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
  return cdp;
}

export class PasskeysPage {
  readonly name: Locator;
  readonly add: Locator;
  readonly list: Locator;

  constructor(private readonly page: Page) {
    this.name = page.getByLabel("Name");
    this.add = page.getByRole("button", { name: "Add passkey" });
    this.list = page.getByRole("list", { name: "Passkeys" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/admin/passkeys");
  }

  item(name: string): Locator {
    return this.list.getByRole("listitem").filter({ hasText: name });
  }

  async remove(name: string): Promise<void> {
    await this.page.getByRole("button", { name: `Remove ${name}` }).click();
    await this.page.getByRole("dialog").getByRole("button", { name: "Remove passkey" }).click();
  }
}
