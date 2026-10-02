import type { Locator, Page } from "@playwright/test";

export interface JobDetails {
  companyName: string;
  positionTitle: string;
  jobDescription: string;
  workArrangement?: "Onsite" | "Hybrid" | "Remote";
}

export class NewCoverLetterPage {
  readonly profileSummary: Locator;
  readonly generate: Locator;

  constructor(private readonly page: Page) {
    this.profileSummary = page.locator("details").filter({ hasText: "Your details" });
    this.generate = page.getByRole("button", { name: "Generate letter" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/admin/cover-letters/new");
  }

  async fill(job: JobDetails): Promise<void> {
    await this.page.getByLabel("Company name").fill(job.companyName);
    await this.page.getByLabel("Position title").fill(job.positionTitle);
    if (job.workArrangement) {
      await this.page.getByLabel("Work arrangement").selectOption({ label: job.workArrangement });
    }
    await this.page.getByLabel("Job description").fill(job.jobDescription);
  }

  fieldError(text: string): Locator {
    return this.page.getByText(text);
  }
}
