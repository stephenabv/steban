import { describe, expect, it } from "vitest";
import { ProfileMatcher } from "@/server/services/coverLetter/ProfileMatcher";
import { ProfileService } from "@/server/services/coverLetter/ProfileService";
import type { Requirement } from "@/server/domain/coverLetter";
import { FakeProfileDataSource, lexicon, softSkills } from "../support/fixtures";

const matcher = new ProfileMatcher(lexicon, softSkills);
const profile = () => new ProfileService(new FakeProfileDataSource()).getProfile();
const skill = (term: string, weight = 1): Requirement => ({ kind: "skill", term, weight });

describe("ProfileMatcher", () => {
  it("matches backed requirements with evidence and reports the rest as unmatched", async () => {
    const report = matcher.match(await profile(), [skill("React"), skill("Kubernetes")]);

    expect(report.matches.map((match) => match.requirement.term)).toEqual(["React"]);
    expect(report.matches[0].evidence.length).toBeGreaterThan(0);
    expect(report.unmatched.map((requirement) => requirement.term)).toEqual(["Kubernetes"]);
  });

  it("ranks experience evidence above a bare skill listing", async () => {
    // TypeScript is backed by a role; Git only by the skills list.
    const report = matcher.match(await profile(), [skill("Git"), skill("TypeScript")]);
    const confidence = (term: string) =>
      report.matches.find((match) => match.requirement.term === term)?.confidence ?? 0;

    expect(confidence("TypeScript")).toBeGreaterThan(confidence("Git"));
    expect(report.matches[0].requirement.term).toBe("TypeScript");
  });

  it("ranks highlights by coverage of the job's technologies", async () => {
    const report = matcher.match(await profile(), [
      skill("Node.js", 3),
      skill("PostgreSQL", 3),
      skill("Express", 2),
    ]);

    expect(report.highlights[0].label).toContain("Blue Harbor Labs");
    expect(report.highlights[0].matchedTechnologies).toEqual(
      expect.arrayContaining(["Node.js", "PostgreSQL"])
    );
  });

  it("matches soft skills only with modest confidence", async () => {
    const report = matcher.match(await profile(), [
      { kind: "softSkill", term: "ownership", weight: 1 },
    ]);
    for (const match of report.matches) expect(match.confidence).toBeLessThanOrEqual(0.8);
  });

  it("is case-insensitive on technology names", async () => {
    const report = matcher.match(await profile(), [skill("react")]);
    expect(report.unmatched).toEqual([]);
  });
});
