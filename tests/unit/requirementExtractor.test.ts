import { describe, expect, it } from "vitest";
import { RequirementExtractor } from "@/server/services/coverLetter/RequirementExtractor";
import { SAMPLE_JOB_DESCRIPTION, lexicon, softSkills } from "../support/fixtures";

const extractor = new RequirementExtractor(lexicon, softSkills);
const terms = (text: string) => extractor.extract(text).map((requirement) => requirement.term);

describe("TechnologyLexicon", () => {
  it.each([
    ["JS", "JavaScript"],
    ["js", "JavaScript"],
    ["TS", "TypeScript"],
    ["Git/GitHub", "Git"],
    ["GitHub", "Git"],
    ["NextJS", "Next.js"],
  ])("normalizes %s to %s", (alias, canonical) => {
    expect(lexicon.normalize(alias)).toBe(canonical);
  });

  it("does not match a technology inside another word", () => {
    expect(
      lexicon.findMentions("We value going the extra mile and a javascripting hobby.")
    ).toEqual([]);
  });

  it("keeps case-sensitive short names from matching ordinary words", () => {
    const found = lexicon.findMentions("You will go to meetings. Experience with Go is required.");
    expect(found.map((mention) => mention.term.name)).toEqual(["Go"]);
  });
});

describe("RequirementExtractor", () => {
  it("extracts canonical technologies from synonyms", () => {
    expect(terms(SAMPLE_JOB_DESCRIPTION)).toEqual(
      expect.arrayContaining([
        "React",
        "TypeScript",
        "JavaScript",
        "Next.js",
        "REST APIs",
        "Git",
        "Kubernetes",
      ])
    );
  });

  it("classifies tools separately from skills", () => {
    const git = extractor
      .extract(SAMPLE_JOB_DESCRIPTION)
      .find((requirement) => requirement.term === "Git");
    expect(git?.kind).toBe("tool");
  });

  it("finds soft skills", () => {
    expect(terms(SAMPLE_JOB_DESCRIPTION)).toEqual(
      expect.arrayContaining(["clear communication", "attention to detail"])
    );
  });

  it("weights repeated technologies higher", () => {
    const requirements = extractor.extract("React and Vue. More React. React again.");
    const weight = (term: string) =>
      requirements.find((requirement) => requirement.term === term)?.weight ?? 0;
    expect(weight("React")).toBeGreaterThan(weight("Vue.js"));
  });

  it("returns nothing for text with no requirements", () => {
    expect(extractor.extract("Hello there.")).toEqual([]);
  });
});

describe("RequirementExtractor responsibilities", () => {
  it("keeps plain duties and skips bullets already counted as technologies or soft skills", () => {
    const requirements = extractor.extract(`Responsibilities:
- Own the checkout flow from design through release
- Experience with React and TS
- Strong communication skills`);
    const duties = requirements.filter((requirement) => requirement.kind === "responsibility");
    expect(duties.map((duty) => duty.term)).toEqual([
      "Own the checkout flow from design through release",
    ]);
  });
});
