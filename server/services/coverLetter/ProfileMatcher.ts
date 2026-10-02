import type {
  ApplicantProfile,
  Evidence,
  MatchReport,
  RankedHighlight,
  Requirement,
  RequirementMatch,
  SoftSkillCatalog,
  TechnologyLexicon,
} from "@/server/domain/coverLetter";

/** How much a single piece of evidence proves on its own. */
const SOURCE_CONFIDENCE = { experience: 0.9, project: 0.8, skill: 0.6 } as const;
const CORROBORATION_BONUS = 0.05;
const SOFT_SKILL_BASE = 0.5;
const SOFT_SKILL_STEP = 0.1;
const SOFT_SKILL_MAX = 0.8;
const RESPONSIBILITY_THRESHOLD = 0.4;
const CURRENT_ROLE_BONUS = 0.5;

const STOPWORDS = new Set(
  "with from that this have will your their they work working able about across using into within also other such well team teams role help make ensure including based plus must strong".split(
    " "
  )
);

interface IndexedItem {
  source: RankedHighlight["source"];
  index: number;
  label: string;
  current: boolean;
  /** Lower-cased canonical technologies. */
  technologies: Set<string>;
  softSkills: Set<string>;
  keywords: Set<string>;
}

const round = (value: number): number => Math.round(value * 100) / 100;

/**
 * Scores the applicant's roles, projects and skills against the posting's
 * requirements. Only profile data counts as evidence, so anything unmatched
 * is a gap the letter must not claim.
 */
export class ProfileMatcher {
  constructor(
    private readonly lexicon: TechnologyLexicon,
    private readonly softSkills: SoftSkillCatalog
  ) {}

  match(profile: ApplicantProfile, requirements: readonly Requirement[]): MatchReport {
    const items = this.index(profile);
    const skills = this.skillLabels(profile);
    const matches: RequirementMatch[] = [];
    const unmatched: Requirement[] = [];

    for (const requirement of requirements) {
      const match = this.matchOne(requirement, items, skills);
      if (match) matches.push(match);
      else unmatched.push(requirement);
    }

    matches.sort(
      (a, b) =>
        b.confidence * b.requirement.weight - a.confidence * a.requirement.weight ||
        a.requirement.term.localeCompare(b.requirement.term)
    );
    return { matches, unmatched, highlights: this.rank(items, requirements) };
  }

  private matchOne(
    requirement: Requirement,
    items: readonly IndexedItem[],
    skills: ReadonlyMap<string, string>
  ): RequirementMatch | null {
    switch (requirement.kind) {
      case "skill":
      case "tool":
        return this.matchTechnology(requirement, items, skills);
      case "softSkill":
        return this.matchSoftSkill(requirement, items);
      case "responsibility":
        return this.matchResponsibility(requirement, items);
    }
  }

  private matchTechnology(
    requirement: Requirement,
    items: readonly IndexedItem[],
    skills: ReadonlyMap<string, string>
  ): RequirementMatch | null {
    const key = requirement.term.toLowerCase();
    const evidence: Evidence[] = items
      .filter((item) => item.technologies.has(key))
      .map(({ source, label }) => ({ source, label }));
    const skillLabel = skills.get(key);
    if (skillLabel) evidence.push({ source: "skill", label: skillLabel });
    if (evidence.length === 0) return null;

    const strongest = Math.max(...evidence.map((e) => SOURCE_CONFIDENCE[e.source]));
    const confidence = Math.min(1, strongest + CORROBORATION_BONUS * (evidence.length - 1));
    return { requirement, evidence, confidence: round(confidence) };
  }

  private matchSoftSkill(
    requirement: Requirement,
    items: readonly IndexedItem[]
  ): RequirementMatch | null {
    const evidence = items
      .filter((item) => item.softSkills.has(requirement.term))
      .map(({ source, label }): Evidence => ({ source, label }));
    if (evidence.length === 0) return null;
    const confidence = Math.min(
      SOFT_SKILL_MAX,
      SOFT_SKILL_BASE + SOFT_SKILL_STEP * (evidence.length - 1)
    );
    return { requirement, evidence, confidence: round(confidence) };
  }

  /** Keyword overlap between a responsibility bullet and a role or project description. */
  private matchResponsibility(
    requirement: Requirement,
    items: readonly IndexedItem[]
  ): RequirementMatch | null {
    const wanted = ProfileMatcher.keywords(requirement.term);
    if (wanted.size < 2) return null;

    const scored = items
      .map((item) => ({
        item,
        overlap: [...wanted].filter((word) => item.keywords.has(word)).length / wanted.size,
      }))
      .filter(({ overlap }) => overlap >= RESPONSIBILITY_THRESHOLD)
      .sort((a, b) => b.overlap - a.overlap);
    if (scored.length === 0) return null;

    return {
      requirement,
      evidence: scored.map(({ item }) => ({ source: item.source, label: item.label })),
      confidence: round(scored[0].overlap),
    };
  }

  /** Roles and projects ordered by how much of the posting's technology they demonstrate. */
  private rank(
    items: readonly IndexedItem[],
    requirements: readonly Requirement[]
  ): RankedHighlight[] {
    const technologies = requirements
      .filter((r) => r.kind === "skill" || r.kind === "tool")
      .toSorted((a, b) => b.weight - a.weight);

    return items
      .map((item): RankedHighlight => {
        const matched = technologies.filter((r) => item.technologies.has(r.term.toLowerCase()));
        const coverage = matched.reduce(
          (sum, r) => sum + r.weight * SOURCE_CONFIDENCE[item.source],
          0
        );
        return {
          source: item.source,
          index: item.index,
          label: item.label,
          matchedTechnologies: matched.map((r) => r.term),
          score: round(coverage > 0 && item.current ? coverage + CURRENT_ROLE_BONUS : coverage),
        };
      })
      .filter((highlight) => highlight.score > 0)
      .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
  }

  private index(profile: ApplicantProfile): IndexedItem[] {
    const experiences = profile.experiences.map((experience, index) =>
      this.indexItem("experience", index, `${experience.role} at ${experience.company}`, {
        current: experience.current,
        tags: experience.technologies,
        prose: experience.description,
      })
    );
    const projects = profile.projects.map((project, index) =>
      this.indexItem("project", index, project.title, {
        current: false,
        tags: project.technologies,
        prose: `${project.summary}\n${project.description}`,
      })
    );
    return [...experiences, ...projects];
  }

  private indexItem(
    source: IndexedItem["source"],
    index: number,
    label: string,
    data: { current: boolean; tags: readonly string[]; prose: string }
  ): IndexedItem {
    const technologies = new Set(data.tags.map((tag) => this.lexicon.normalize(tag).toLowerCase()));
    for (const { term } of this.lexicon.findMentions(data.prose))
      technologies.add(term.name.toLowerCase());
    return {
      source,
      index,
      label,
      current: data.current,
      technologies,
      softSkills: new Set(this.softSkills.findMentions(data.prose).map(({ term }) => term.name)),
      keywords: ProfileMatcher.keywords(data.prose),
    };
  }

  /** Lower-cased canonical skill → "Name (Category)". */
  private skillLabels(profile: ApplicantProfile): Map<string, string> {
    const labels = new Map<string, string>();
    for (const group of profile.skillGroups) {
      for (const skill of group.skills) {
        labels.set(this.lexicon.normalize(skill).toLowerCase(), `${skill} (${group.category})`);
      }
    }
    return labels;
  }

  /** Content words of four letters or more, lightly stemmed. */
  private static keywords(text: string): Set<string> {
    const words = text.toLowerCase().match(/\p{L}{4,}/gu) ?? [];
    return new Set(
      words
        .filter((word) => !STOPWORDS.has(word))
        .map((word) => word.replace(/(?:ing|ed|es|s)$/, "") || word)
    );
  }
}
