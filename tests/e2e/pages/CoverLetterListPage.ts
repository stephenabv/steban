import type { Locator, Page } from "@playwright/test";

export class CoverLetterListPage {
  readonly heading: Locator;
  readonly newLetter: Locator;
  readonly search: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole("heading", { level: 1, name: "Cover Letters" });
    this.newLetter = page.getByRole("link", { name: "New cover letter" });
    this.search = page.getByRole("searchbox", { name: "Search cover letters" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/admin/cover-letters");
  }

  row(company: string): Locator {
    return this.page.getByRole("row").filter({ hasText: company });
  }
}
