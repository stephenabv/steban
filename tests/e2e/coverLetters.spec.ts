import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { CoverLetterEditorPage } from "./pages/CoverLetterEditorPage";
import { CoverLetterListPage } from "./pages/CoverLetterListPage";
import { NewCoverLetterPage } from "./pages/NewCoverLetterPage";

const COMPANY = `E2E Widgets ${Date.now()}`;
const JOB_DESCRIPTION = `We're hiring a Frontend Engineer.

Requirements:
- Experience with React and TS
- Next.js in production
- Kubernetes is a plus`;

test.describe.configure({ mode: "serial" });

async function expectNoHorizontalScroll(page: Page): Promise<void> {
  await page.setViewportSize({ width: 375, height: 800 });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await page.setViewportSize({ width: 1280, height: 720 });
}

test.describe("cover letters", () => {
  test("validates the form on the client", async ({ page }) => {
    const form = new NewCoverLetterPage(page);
    await form.goto();
    await form.generate.click();
    await expect(form.fieldError("Company name is required.")).toBeVisible();
    await expect(form.fieldError("Job description is required.")).toBeVisible();
  });

  test("creates, edits, exports and deletes a letter", async ({ page }) => {
    const form = new NewCoverLetterPage(page);
    await form.goto();
    await expect(form.profileSummary).toContainText("Stephen Abueva");
    await expectNoHorizontalScroll(page);

    await form.fill({
      companyName: COMPANY,
      positionTitle: "Frontend Engineer",
      jobDescription: JOB_DESCRIPTION,
      workArrangement: "Hybrid",
    });
    await form.generate.click();

    const editor = new CoverLetterEditorPage(page);
    await expect(page.getByRole("heading", { level: 1, name: COMPANY })).toBeVisible();
    await expect(editor.matches).toContainText("React");
    await expect(editor.gaps).toContainText("Kubernetes");
    await expect(editor.paragraph(1)).toHaveValue(/Frontend Engineer/);
    await expect(editor.paragraph(2)).not.toHaveValue(/Kubernetes/);
    await expectNoHorizontalScroll(page);

    // Edit and save.
    await editor.salutation.fill("Dear Hiring Team,");
    await expect(page.getByText("Unsaved changes")).toBeVisible();
    await expect(page.getByRole("button", { name: "PDF" })).toBeDisabled();
    await editor.saveDraft.click();
    await expect(page.getByText("All changes saved")).toBeVisible();

    // The saved edit survives a reload.
    await page.reload();
    await expect(editor.salutation).toHaveValue("Dear Hiring Team,");
    await editor.showPreview();
    await expect(editor.preview).toContainText("Dear Hiring Team,");
    await expect(editor.preview).toContainText("Sincerely,");

    // Export.
    const text = await editor.download("Text");
    expect(text.suggestedFilename()).toMatch(/\.txt$/);
    expect(await readFile(await text.path(), "utf8")).toContain("Dear Hiring Team,");
    const pdf = await editor.download("PDF");
    expect((await readFile(await pdf.path())).subarray(0, 5).toString("latin1")).toBe("%PDF-");

    // Finalize freezes the letter.
    await editor.markFinal.click();
    await expect(editor.reopen).toBeVisible();
    await expect(page.getByText("This letter is final")).toBeVisible();

    // It shows in the list, and delete asks for confirmation.
    const list = new CoverLetterListPage(page);
    await list.goto();
    await list.search.fill(COMPANY);
    await expect(list.row(COMPANY)).toContainText("Final");
    await list
      .row(COMPANY)
      .getByRole("link", { name: /^Open / })
      .click();
    await editor.delete();
    await expect(list.heading).toBeVisible();
    await expect(page.getByText(COMPANY)).toHaveCount(0);
  });
});
