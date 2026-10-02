import { describe, expect, it } from "vitest";
import { CLOSING_LINES, LetterLengthPolicy, LetterText } from "@/server/domain/coverLetter";
import { BANNED_PHRASES } from "@/server/services/coverLetter/generators/StyleGuard";
import {
  FakeProfileDataSource,
  generationRequest,
  sampleApplication,
  sampleProfileData,
  templateGenerator,
} from "../support/fixtures";

const generator = templateGenerator();

describe("TemplateCoverLetterGenerator", () => {
  it("produces the full letter structure", async () => {
    const { sections, strategy } = await generator.generate(await generationRequest());

    expect(strategy).toBe("template");
    expect(sections.header.fullName).toBe("Stephen Abueva");
    expect(sections.header.lines).toEqual([
      "stephen@example.com",
      "steban.vercel.app",
      "github.com/stephenabv",
      "linkedin.com/in/stephenabv",
    ]);
    expect(sections.date).toBe("October 2, 2026");
    expect(sections.recipient).toEqual(["Hiring Manager", "Acme Corp", "Makati City"]);
    expect(sections.salutation).toBe("Dear Hiring Manager,");
    expect(sections.body).toHaveLength(3);
    expect(sections.closing).toEqual([...CLOSING_LINES]);
    expect(sections.signature).toBe("Stephen Abueva");
  });

  it("opens with the role and closes with the portfolio and a call to action", async () => {
    const { sections } = await generator.generate(await generationRequest());
    const [opening, , closing] = sections.body.map((paragraph) =>
      LetterText.paragraphText(paragraph)
    );

    expect(opening).toContain("Frontend Engineer");
    expect(opening).toContain("Acme Corp");
    expect(closing).toContain("steban.vercel.app");
  });

  it("names the job's technologies in bold", async () => {
    const { sections } = await generator.generate(await generationRequest());
    const bold = sections.body
      .flat()
      .filter((run) => run.bold)
      .map((run) => run.text);
    expect(bold.join(" ")).toMatch(/React|TypeScript|Next\.js/);
  });

  it("never claims a requirement the profile lacks", async () => {
    const letter = await generator.generate(await generationRequest());
    expect(letter.plainText).not.toMatch(/Kubernetes/i);
  });

  it.each(["concise", "standard"] as const)(
    "keeps a %s letter within its word limit",
    async (length) => {
      const letter = await generator.generate(
        await generationRequest(sampleApplication({ length }))
      );
      expect(letter.wordCount).toBeLessThanOrEqual(LetterLengthPolicy.band(length).max);
      expect(letter.wordCount).toBe(LetterText.bodyWordCount(letter.sections.body));
    }
  );

  it("writes a concise letter shorter than a standard one", async () => {
    const concise = await generator.generate(
      await generationRequest(sampleApplication({ length: "concise" }))
    );
    const standard = await generator.generate(
      await generationRequest(sampleApplication({ length: "standard" }))
    );
    expect(concise.wordCount).toBeLessThan(standard.wordCount);
  });

  it("changes wording with tone", async () => {
    const professional = await generator.generate(await generationRequest());
    const warm = await generator.generate(
      await generationRequest(sampleApplication({ tone: "warm" }))
    );
    expect(warm.plainText).not.toBe(professional.plainText);
  });

  it("avoids clichés and em dashes", async () => {
    const { plainText } = await generator.generate(await generationRequest());
    for (const phrase of BANNED_PHRASES) expect(plainText.toLowerCase()).not.toContain(phrase);
    expect(plainText).not.toContain("—");
  });

  it("mentions the schedule for the work arrangement", async () => {
    const request = await generationRequest(
      sampleApplication({ workArrangement: { mode: "remote", schedule: "night shift (US hours)" } })
    );
    const { plainText } = await generator.generate(request);
    expect(plainText).toContain("night shift (US hours)");
  });

  it("is deterministic", async () => {
    const first = await generator.generate(await generationRequest());
    const second = await generator.generate(await generationRequest());
    expect(second.plainText).toBe(first.plainText);
  });
});

describe("TemplateCoverLetterGenerator length notices", () => {
  it.each(["concise", "standard"] as const)(
    "reaches the %s band from a detailed profile without a notice",
    async (length) => {
      const letter = await generator.generate(
        await generationRequest(sampleApplication({ length }))
      );
      expect(LetterLengthPolicy.assess(length, letter.wordCount)).toBe("within");
      expect(letter.notices).toEqual([]);
    }
  );

  it("explains a short letter instead of padding it", async () => {
    const data = sampleProfileData();
    const thin = {
      ...data,
      about: data.about && {
        ...data.about,
        experience: data.about.experience.map((role) => ({ ...role, description: "" })),
      },
      projects: [],
    };
    const letter = await generator.generate(
      await generationRequest(sampleApplication(), new FakeProfileDataSource(thin))
    );

    expect(LetterLengthPolicy.assess("standard", letter.wordCount)).toBe("under");
    expect(letter.notices).toEqual([expect.stringContaining("below the 250–350 target")]);
  });
});
