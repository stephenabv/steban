import type { ApplicantProfile } from "./ApplicantProfile";
import { profileTechnologies } from "./ApplicantProfile";
import type { TechnologyLexicon } from "./TechnologyLexicon";

/**
 * The set of technologies the applicant can truthfully claim, normalized
 * through the lexicon so "JS" in a project tag backs "JavaScript" in a letter.
 */
export class ProfileVocabulary {
  private readonly known: Map<string, string>;

  private constructor(names: Iterable<string>) {
    this.known = new Map([...names].filter(Boolean).map((name) => [name.toLowerCase(), name]));
  }

  static fromProfile(profile: ApplicantProfile, lexicon: TechnologyLexicon): ProfileVocabulary {
    const names = new Set<string>();
    for (const raw of profileTechnologies(profile)) names.add(lexicon.normalize(raw));
    // Technologies named in role and project descriptions count too.
    const prose = [
      ...profile.experiences.map((experience) => experience.description),
      ...profile.projects.flatMap((project) => [project.summary, project.description]),
    ].join("\n");
    for (const mention of lexicon.findMentions(prose)) names.add(mention.term.name);
    return new ProfileVocabulary(names);
  }

  has(term: string): boolean {
    return this.known.has(term.toLowerCase());
  }

  /** Display names, alphabetical. */
  list(): string[] {
    return [...this.known.values()].sort((a, b) => a.localeCompare(b));
  }
}
