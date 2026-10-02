import { describe, expect, it } from "vitest";
import {
  coverLetterEditSchema,
  coverLetterIdSchema,
  exportFormatSchema,
  fieldErrorsOf,
  generateCoverLetterSchema,
  jobApplicationSchema,
  regenerateCoverLetterSchema,
} from "@/server/security/coverLetterSchemas";
import type { JobApplicationFormInput } from "@/server/security/coverLetterSchemas";

const valid = (): JobApplicationFormInput => ({
  companyName: "  Acme Corp  ",
  companyLocation: "",
  hiringManager: "",
  positionTitle: "Frontend Engineer",
  workArrangement: { mode: "hybrid", schedule: "3 days onsite" },
  jobDescription: "React and TypeScript.",
  industryContext: "",
  postingUrl: "",
  letterDate: "",
  tone: "warm",
  length: "concise",
});

const errorsFor = (input: unknown) => {
  const result = jobApplicationSchema.safeParse(input);
  return result.success ? {} : fieldErrorsOf(result.error);
};

describe("jobApplicationSchema", () => {
  it("trims text and turns empty optional fields into undefined", () => {
    const parsed = jobApplicationSchema.parse(valid());
    expect(parsed.companyName).toBe("Acme Corp");
    expect(parsed.companyLocation).toBeUndefined();
    expect(parsed.postingUrl).toBeUndefined();
    expect(parsed.letterDate).toBeUndefined();
  });

  it("requires company, position and job description", () => {
    const errors = errorsFor({
      ...valid(),
      companyName: " ",
      positionTitle: "",
      jobDescription: "",
    });
    expect(Object.keys(errors)).toEqual(["companyName", "positionTitle", "jobDescription"]);
  });

  it("caps the job description at 20,000 characters", () => {
    expect(errorsFor({ ...valid(), jobDescription: "a".repeat(20_000) })).toEqual({});
    expect(errorsFor({ ...valid(), jobDescription: "a".repeat(20_001) })).toEqual({
      jobDescription: "Job description must be at most 20,000 characters.",
    });
  });

  it("rejects unexpected fields, including nested ones", () => {
    expect(jobApplicationSchema.safeParse({ ...valid(), ownerId: "someone-else" }).success).toBe(
      false
    );
    expect(
      jobApplicationSchema.safeParse({
        ...valid(),
        workArrangement: { mode: "remote", schedule: "", admin: true },
      }).success
    ).toBe(false);
  });

  it.each(["javascript:alert(1)", "ftp://example.com/job", "not a url"])(
    "rejects the posting URL %s",
    (postingUrl) => {
      expect(errorsFor({ ...valid(), postingUrl })).toHaveProperty("postingUrl");
    }
  );

  it("accepts an https posting URL as a reference", () => {
    expect(
      jobApplicationSchema.parse({ ...valid(), postingUrl: "https://jobs.example.com/1" })
        .postingUrl
    ).toBe("https://jobs.example.com/1");
  });

  it.each(["2026-02-30", "2026-13-01", "02/10/2026"])("rejects the date %s", (letterDate) => {
    expect(errorsFor({ ...valid(), letterDate })).toHaveProperty("letterDate");
  });

  it("rejects unknown enum values", () => {
    expect(errorsFor({ ...valid(), tone: "casual" })).toHaveProperty("tone");
    expect(
      errorsFor({ ...valid(), workArrangement: { mode: "moon", schedule: "" } })
    ).toHaveProperty("workArrangement.mode");
  });
});

describe("action schemas", () => {
  it("keys nested errors by their dotted path", () => {
    const result = generateCoverLetterSchema.safeParse({
      application: { ...valid(), companyName: "" },
      strategy: "template",
    });
    expect(result.success ? {} : fieldErrorsOf(result.error)).toHaveProperty(
      "application.companyName"
    );
  });

  it("rejects an unknown strategy", () => {
    expect(
      regenerateCoverLetterSchema.safeParse({ strategy: "gpt", tone: "warm", length: "concise" })
        .success
    ).toBe(false);
  });

  it("parses bold markup in edited paragraphs into runs", () => {
    const parsed = coverLetterEditSchema.parse({
      date: "October 2, 2026",
      salutation: "Dear Ms. Cruz,",
      body: ["I use **React** daily."],
    });
    expect(parsed.body).toEqual([
      [{ text: "I use " }, { text: "React", bold: true }, { text: " daily." }],
    ]);
  });

  it("limits the number and size of paragraphs", () => {
    const edit = { date: "Today", salutation: "Hi," };
    expect(coverLetterEditSchema.safeParse({ ...edit, body: [] }).success).toBe(false);
    expect(coverLetterEditSchema.safeParse({ ...edit, body: Array(7).fill("Text.") }).success).toBe(
      false
    );
    expect(coverLetterEditSchema.safeParse({ ...edit, body: ["a".repeat(2_001)] }).success).toBe(
      false
    );
  });

  it("accepts only UUID ids and known export formats", () => {
    expect(coverLetterIdSchema.safeParse("../../etc/passwd").success).toBe(false);
    expect(coverLetterIdSchema.safeParse("6f1c1a52-6a0e-4f0c-9d2f-0c4b7b0d6a11").success).toBe(
      true
    );
    expect(exportFormatSchema.safeParse("html").success).toBe(false);
  });
});
