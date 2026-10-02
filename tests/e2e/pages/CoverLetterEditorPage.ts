import type { Download, Locator, Page } from "@playwright/test";

export class CoverLetterEditorPage {
  readonly salutation: Locator;
  readonly saveDraft: Locator;
  readonly markFinal: Locator;
  readonly reopen: Locator;
  readonly preview: Locator;
  readonly gaps: Locator;
  readonly matches: Locator;
  readonly status: Locator;

  constructor(private readonly page: Page) {
    this.salutation = page.getByLabel("Salutation");
    this.saveDraft = page.getByRole("button", { name: "Save draft" });
    this.markFinal = page.getByRole("button", { name: "Mark final" });
    this.reopen = page.getByRole("button", { name: "Reopen as draft" });
    this.preview = page.getByRole("article", { name: "Cover letter preview" });
    this.gaps = page.getByRole("region", { name: "Gaps not mentioned" });
    this.matches = page.getByRole("region", { name: "Matched requirements" });
    this.status = page.getByText(/^(Draft|Final)$/);
  }

  paragraph(number: number): Locator {
    return this.page.getByLabel(`Paragraph ${number}`);
  }

  async showPreview(): Promise<void> {
    await this.page.getByRole("button", { name: "Preview", exact: true }).click();
  }

  async download(format: "PDF" | "DOCX" | "Text"): Promise<Download> {
    const download = this.page.waitForEvent("download");
    await this.page.getByRole("link", { name: format, exact: true }).click();
    return download;
  }

  async delete(): Promise<void> {
    await this.page.getByRole("button", { name: /^Delete / }).click();
    await this.page.getByRole("button", { name: "Delete letter" }).click();
  }
}
