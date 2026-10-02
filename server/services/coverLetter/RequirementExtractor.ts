import type { Requirement, SoftSkillCatalog } from "@/server/domain/coverLetter";
import { TechnologyLexicon } from "@/server/domain/coverLetter";

/** A bullet line: "-", "*", "•", "·", "–" or "1." / "1)" followed by text. */
const BULLET = /^\s*(?:[-*•·–]|\d{1,2}[.)])\s+(.+)$/;
const MIN_RESPONSIBILITY_LENGTH = 12;
const MAX_RESPONSIBILITY_LENGTH = 240;
const MAX_RESPONSIBILITIES = 12;

const byWeightThenName = (a: Requirement, b: Requirement): number =>
  b.weight - a.weight || a.term.localeCompare(b.term);

/**
 * Turns a pasted job description into requirements: skills and tools (via
 * the lexicon, so synonyms collapse), soft skills, and bulleted
 * responsibilities. Pure text processing: the description is never executed,
 * fetched or rendered.
 */
export class RequirementExtractor {
  constructor(
    private readonly lexicon: TechnologyLexicon,
    private readonly softSkills: SoftSkillCatalog
  ) {}

  extract(jobDescription: string): Requirement[] {
    const technologies = this.lexicon
      .findMentions(jobDescription)
      .map(({ term, count }): Requirement => ({
        kind: TechnologyLexicon.isTool(term.kind) ? "tool" : "skill",
        term: term.name,
        weight: count,
      }));
    const softSkills = this.softSkills
      .findMentions(jobDescription)
      .map(({ term, count }): Requirement => ({
        kind: "softSkill",
        term: term.name,
        weight: count,
      }));

    return [
      ...technologies.sort(byWeightThenName),
      ...softSkills.sort(byWeightThenName),
      ...this.responsibilities(jobDescription),
    ];
  }

  private responsibilities(jobDescription: string): Requirement[] {
    const seen = new Set<string>();
    const found: Requirement[] = [];
    for (const line of jobDescription.split(/\r?\n/)) {
      const text = BULLET.exec(line)?.[1]
        ?.trim()
        .replace(/[.;]+$/, "");
      if (
        !text ||
        text.length < MIN_RESPONSIBILITY_LENGTH ||
        text.length > MAX_RESPONSIBILITY_LENGTH
      ) {
        continue;
      }
      const key = text.toLowerCase();
      if (seen.has(key) || this.namesKnownTerm(text)) continue;
      seen.add(key);
      found.push({ kind: "responsibility", term: text, weight: 1 });
      if (found.length === MAX_RESPONSIBILITIES) break;
    }
    return found;
  }

  /** A line like "React and TS experience" is already counted as its technologies. */
  private namesKnownTerm(text: string): boolean {
    return (
      this.lexicon.findMentions(text).length > 0 || this.softSkills.findMentions(text).length > 0
    );
  }
}
