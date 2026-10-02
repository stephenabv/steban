import { describe, expect, it, vi } from "vitest";
import {
  CoverLetterError,
  CoverLetterNotFoundError,
  LetterText,
} from "@/server/domain/coverLetter";
import type { Result } from "@/server/domain/types";
import type { JobApplicationInput } from "@/server/services/coverLetter/CoverLetterService";
import {
  FakeLlmClient,
  FakeProfileDataSource,
  aiGenerator,
  buildService,
  sampleApplication,
  sampleProfileData,
  templateGenerator,
  TODAY,
} from "../support/fixtures";

const OWNER = "admin";
const OTHER_OWNER = "intruder";

function unwrap<T>(result: Result<T>): T {
  if (!result.ok) throw result.error;
  return result.value;
}

function input(overrides: Partial<JobApplicationInput> = {}): JobApplicationInput {
  return { ...sampleApplication(), letterDate: undefined, ...overrides };
}

async function generated(overrides: Partial<JobApplicationInput> = {}) {
  const context = buildService();
  const outcome = unwrap(await context.service.generate(OWNER, input(overrides), "template"));
  return { ...context, outcome, id: outcome.record.letter.id };
}

describe("CoverLetterService", () => {
  describe("generate", () => {
    it("stores a draft letter with its application and match report", async () => {
      const { service, outcome, id } = await generated();

      expect(outcome.record.letter).toMatchObject({
        status: "draft",
        generator: "template",
        ownerId: OWNER,
      });
      expect(outcome.record.application).toMatchObject({
        companyName: "Acme Corp",
        ownerId: OWNER,
      });
      expect(outcome.record.letter.applicationId).toBe(outcome.record.application.id);
      expect(outcome.record.letter.matchReport.unmatched.map((r) => r.term)).toContain(
        "Kubernetes"
      );
      expect(unwrap(await service.get(OWNER, id)).letter.plainText).toBe(
        outcome.record.letter.plainText
      );
    });

    it("defaults the hiring manager and the date (today in Manila)", async () => {
      const { outcome } = await generated({ hiringManager: "  " });
      expect(outcome.record.application.hiringManager).toBe("Hiring Manager");
      expect(outcome.record.application.letterDate).toBe(TODAY);
    });

    it("keeps an explicit letter date", async () => {
      const { outcome } = await generated({ letterDate: "2026-11-15" });
      expect(outcome.record.letter.sections.date).toBe("November 15, 2026");
    });

    it("refuses a strategy that is not enabled", async () => {
      const { service } = buildService();
      const result = await service.generate(OWNER, input(), "ai");
      expect(result.ok).toBe(false);
      expect(!result.ok && result.error).toBeInstanceOf(CoverLetterError);
    });

    it("reports a missing profile name as a user-facing error", async () => {
      const data = sampleProfileData();
      const { service } = buildService({
        source: new FakeProfileDataSource({
          ...data,
          hero: data.hero && { ...data.hero, name: " " },
        }),
      });
      const result = await service.generate(OWNER, input(), "template");
      expect(!result.ok && result.error.message).toMatch(/Add your name in Hero/);
    });

    it("falls back to the template and says so when the AI generator fails", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const { service } = buildService({
        generators: [templateGenerator(), aiGenerator(new FakeLlmClient(new Error("down")))],
      });
      const outcome = unwrap(await service.generate(OWNER, input(), "ai"));
      expect(outcome.record.letter.generator).toBe("template");
      expect(outcome.notices).toEqual([expect.stringContaining("template generator")]);
    });
  });

  describe("owner scoping", () => {
    it("hides letters from other owners for every operation", async () => {
      const { service, id } = await generated();
      const edit = { date: "Today", salutation: "Hi,", body: [[{ text: "Hello." }]] };

      const attempts = await Promise.all([
        service.get(OTHER_OWNER, id),
        service.saveEdit(OTHER_OWNER, id, edit),
        service.finalize(OTHER_OWNER, id),
        service.regenerate(OTHER_OWNER, id, {
          strategy: "template",
          tone: "warm",
          length: "concise",
        }),
        service.duplicateForNewCompany(OTHER_OWNER, id),
        service.export(OTHER_OWNER, id, "txt"),
        service.delete(OTHER_OWNER, id),
      ]);

      for (const result of attempts) {
        expect(!result.ok && result.error).toBeInstanceOf(CoverLetterNotFoundError);
      }
      expect(unwrap(await service.list(OTHER_OWNER))).toEqual([]);
      expect(unwrap(await service.get(OWNER, id)).letter.status).toBe("draft");
    });
  });

  describe("editing and lifecycle", () => {
    it("saves edits and warns about unbacked technologies without blocking", async () => {
      const { service, id } = await generated();
      const outcome = unwrap(
        await service.saveEdit(OWNER, id, {
          date: "October 3, 2026",
          salutation: "Dear Ms. Cruz,",
          body: [
            LetterText.parseMarkup("I use **React** daily."),
            LetterText.parseMarkup("I also run **Kubernetes** clusters."),
            LetterText.parseMarkup("Thanks."),
          ],
        })
      );

      expect(outcome.warnings).toEqual(["Kubernetes"]);
      expect(outcome.record.letter.sections.salutation).toBe("Dear Ms. Cruz,");
      expect(outcome.record.letter.plainText).toContain("I also run Kubernetes clusters.");
      expect(outcome.record.letter.sections.signature).toBe("Stephen Abueva");
    });

    it("freezes a final letter until it is reopened", async () => {
      const { service, id } = await generated();
      expect(unwrap(await service.finalize(OWNER, id)).letter.status).toBe("final");

      const edit = await service.saveEdit(OWNER, id, {
        date: "x",
        salutation: "y",
        body: [[{ text: "z" }]],
      });
      const regenerate = await service.regenerate(OWNER, id, {
        strategy: "template",
        tone: "warm",
        length: "standard",
      });
      const again = await service.finalize(OWNER, id);
      for (const result of [edit, regenerate, again]) {
        expect(!result.ok && result.error).toBeInstanceOf(CoverLetterError);
      }

      expect(unwrap(await service.reopen(OWNER, id)).letter.status).toBe("draft");
      expect(
        (await service.saveEdit(OWNER, id, { date: "x", salutation: "y", body: [[{ text: "z" }]] }))
          .ok
      ).toBe(true);
    });

    it("regenerates with a new tone and length and records them", async () => {
      const { service, id, outcome } = await generated();
      const regenerated = unwrap(
        await service.regenerate(OWNER, id, {
          strategy: "template",
          tone: "warm",
          length: "concise",
        })
      );

      expect(regenerated.record.application).toMatchObject({ tone: "warm", length: "concise" });
      expect(regenerated.record.letter.plainText).not.toBe(outcome.record.letter.plainText);
      expect(regenerated.record.letter.id).toBe(id);
    });
  });

  describe("list, duplicate, export and delete", () => {
    it("lists summaries newest first without letter or job content", async () => {
      const { service } = buildService();
      unwrap(await service.generate(OWNER, input({ companyName: "First Co" }), "template"));
      unwrap(await service.generate(OWNER, input({ companyName: "Second Co" }), "template"));

      const list = unwrap(await service.list(OWNER));
      expect(list.map((item) => item.companyName)).toEqual(["Second Co", "First Co"]);
      expect(JSON.stringify(list)).not.toContain("React and TS");
    });

    it("duplicates an application for a new company with company fields cleared", async () => {
      const { service, id } = await generated({ industryContext: "Fintech client" });
      const copy = unwrap(await service.duplicateForNewCompany(OWNER, id));

      expect(copy).toMatchObject({
        companyName: "",
        companyLocation: undefined,
        hiringManager: "Hiring Manager",
        industryContext: undefined,
        positionTitle: "Frontend Engineer",
        letterDate: TODAY,
      });
      expect(copy.jobDescription).toContain("React");
    });

    it("exports the saved letter", async () => {
      const { service, id } = await generated();
      const file = unwrap(await service.export(OWNER, id, "txt"));
      expect(Buffer.from(file.bytes).toString("utf8")).toContain("Dear Hiring Manager,");
    });

    it("deletes a letter", async () => {
      const { service, id } = await generated();
      expect(unwrap(await service.delete(OWNER, id))).toBe(true);
      const after = await service.get(OWNER, id);
      expect(!after.ok && after.error).toBeInstanceOf(CoverLetterNotFoundError);
    });
  });
});
