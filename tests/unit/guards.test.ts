import { describe, expect, it } from "vitest";
import { HonestyViolationError, LetterText } from "@/server/domain/coverLetter";
import { HonestyGuard } from "@/server/services/coverLetter/generators/HonestyGuard";
import { LengthEnforcer } from "@/server/services/coverLetter/generators/LengthEnforcer";
import type { LetterDraft } from "@/server/services/coverLetter/generators/LetterDraft";
import { sentence } from "@/server/services/coverLetter/generators/LetterDraft";
import { StyleGuard } from "@/server/services/coverLetter/generators/StyleGuard";
import { ProfileService } from "@/server/services/coverLetter/ProfileService";
import { FakeProfileDataSource, lexicon, sampleApplication } from "../support/fixtures";

const guard = new HonestyGuard(lexicon);
const context = async (overrides = {}) =>
  guard.context(
    await new ProfileService(new FakeProfileDataSource()).getProfile(),
    sampleApplication(overrides)
  );
const draft = (...paragraphs: string[][]): LetterDraft => ({
  paragraphs: paragraphs.map((texts) => texts.map((text) => sentence([text]))),
});
const texts = (result: LetterDraft) =>
  result.paragraphs.map((p) => p.map((item) => LetterText.paragraphText(item.runs)));

describe("HonestyGuard", () => {
  it("flags technologies the profile does not back, including synonyms", async () => {
    const ctx = await context();
    expect(guard.findViolations("I use React, K8s and Python daily.", ctx).sort()).toEqual([
      "Kubernetes",
      "Python",
    ]);
    expect(guard.findViolations("I use JS and TS daily.", ctx)).toEqual([]);
  });

  it("ignores technologies inside the job's own wording and in links", async () => {
    const ctx = await context({ positionTitle: "Python Developer", companyName: "Rust Belt Co" });
    expect(
      guard.findViolations(
        "I am applying for the Python Developer role at Rust Belt Co. See https://steban.vercel.app.",
        ctx
      )
    ).toEqual([]);
  });

  it("removes only offending sentences and reports what it removed", async () => {
    const result = guard.enforce(
      draft(["I use React.", "I deployed on Kubernetes."], ["I write TypeScript."]),
      await context()
    );
    expect(texts(result.draft)).toEqual([["I use React."], ["I write TypeScript."]]);
    expect(result.removedTerms).toEqual(["Kubernetes"]);
  });

  it("rejects a finished body that still makes an unbacked claim", async () => {
    const body = [LetterText.parseMarkup("I know **Kubernetes**.")];
    const ctx = await context();
    expect(() => guard.verify(body, ctx)).toThrow(HonestyViolationError);
  });
});

describe("LengthEnforcer", () => {
  const enforcer = new LengthEnforcer();
  const words = (count: number) =>
    `${Array.from({ length: count - 1 }, () => "word").join(" ")} end.`;

  it("drops optional sentences first, from the evidence paragraph", () => {
    const input: LetterDraft = {
      paragraphs: [
        [sentence([words(10)])],
        [sentence([words(10)]), sentence([words(10)], true)],
        [sentence([words(10)]), sentence([words(10)], true)],
      ],
    };
    const fitted = enforcer.fit(input, { min: 0, max: 40 });
    expect(fitted.paragraphs.map((p) => p.length)).toEqual([1, 1, 2]);
  });

  it("never empties a paragraph or removes the opening and call to action", () => {
    const input: LetterDraft = {
      paragraphs: [[sentence([words(50)])], [sentence([words(50)])], [sentence([words(50)])]],
    };
    const fitted = enforcer.fit(input, { min: 0, max: 10 });
    expect(fitted.paragraphs.map((p) => p.length)).toEqual([1, 1, 1]);
  });

  it("leaves a letter within the limit untouched", () => {
    const input = draft(["Short."], ["Short."], ["Short."]);
    expect(enforcer.fit(input, { min: 0, max: 100 })).toEqual(input);
  });
});

describe("StyleGuard", () => {
  const style = new StyleGuard();

  it("drops clichés and replaces em dashes", () => {
    const result = style.clean(
      draft(["I am a results-driven engineer.", "I ship quickly — and carefully."]),
      ""
    );
    expect(texts(result)).toEqual([["I ship quickly, and carefully."]]);
  });

  it("drops invented metrics but keeps the applicant's own numbers", () => {
    const result = style.clean(
      draft(["I cut load time by 40%.", "My library serves four product teams across 3 regions."]),
      "Shared library used across 3 regions."
    );
    expect(texts(result)).toEqual([["My library serves four product teams across 3 regions."]]);
  });
});
