import type {
  ApplicantProfile,
  GeneratorStrategy,
  LetterLength,
  Paragraph,
  RankedHighlight,
  TechnologyLexicon,
} from "@/server/domain/coverLetter";
import {
  CoverLetterError,
  HonestyViolationError,
  JOB_APPLICATION_LIMITS,
  LetterLengthPolicy,
  LetterText,
} from "@/server/domain/coverLetter";
import type { HonestyGuard } from "./HonestyGuard";
import type { LengthEnforcer } from "./LengthEnforcer";
import type { LetterSectionRenderer } from "./LetterSectionRenderer";
import type {
  GeneratedLetter,
  GenerationRequest,
  LetterDraft,
  LetterOutline,
  OutlineHighlight,
} from "./LetterDraft";
import type { StyleGuard } from "./StyleGuard";

export interface GeneratorDependencies {
  lexicon: TechnologyLexicon;
  honestyGuard: HonestyGuard;
  styleGuard: StyleGuard;
  lengthEnforcer: LengthEnforcer;
  sectionRenderer: LetterSectionRenderer;
}

const BODY_PARAGRAPHS = 3;
const FIT_TECHNOLOGIES = 3;
const ADDITIONAL_TECHNOLOGIES = 4;
const HIGHLIGHT_TECHNOLOGIES = 3;
const SOFT_SKILLS = 2;
const MAX_DETAIL_LENGTH = 220;
const HIGHLIGHTS: Record<LetterLength, number> = { concise: 2, standard: 3 };
const DETAILS_PER_HIGHLIGHT: Record<LetterLength, number> = { concise: 2, standard: 3 };
/** Irregular past-tense verbs that commonly open a role description. */
const PAST_TENSE_VERBS = new Set(
  "Built Led Wrote Made Ran Drove Grew Set Took Taught Brought Won Kept Found Rebuilt Rewrote Oversaw Began".split(
    " "
  )
);

/**
 * Template method for every generator. The shared pipeline is fixed here:
 * validate → outline → compose (the only step subclasses implement) → style
 * and honesty repair → length → render sections → final honesty check.
 */
export abstract class CoverLetterGenerator {
  abstract readonly strategy: GeneratorStrategy;

  constructor(protected readonly deps: GeneratorDependencies) {}

  async generate(request: GenerationRequest): Promise<GeneratedLetter> {
    this.validate(request);
    const outline = this.buildOutline(request);
    const composed = await this.compose(outline);

    const honesty = this.deps.honestyGuard.context(request.profile, request.application);
    const styled = this.deps.styleGuard.clean(
      composed,
      CoverLetterGenerator.profileText(request.profile)
    );
    const { draft, removedTerms } = this.deps.honestyGuard.enforce(styled, honesty);
    const fitted = this.deps.lengthEnforcer.fit(draft, outline.band);
    const body = this.toBody(fitted, removedTerms);

    const sections = this.deps.sectionRenderer.render(request.profile, request.application, body);
    this.deps.honestyGuard.verify(sections.body, honesty);

    const wordCount = LetterText.bodyWordCount(sections.body);
    return {
      strategy: this.strategy,
      sections,
      plainText: LetterText.toPlainText(sections),
      wordCount,
      removedTerms,
      notices: CoverLetterGenerator.lengthNotices(request.application.length, wordCount),
    };
  }

  /** Short letters are not padded with invented content; the admin is told why instead. */
  private static lengthNotices(length: LetterLength, wordCount: number): string[] {
    if (LetterLengthPolicy.assess(length, wordCount) !== "under") return [];
    const { min, max } = LetterLengthPolicy.band(length);
    return [
      `This letter is ${wordCount} words, below the ${min}–${max} target, because your profile has ` +
        "little detail that matches this job. Fuller role and project descriptions give it more to draw on.",
    ];
  }

  /** Writes the three body paragraphs from the outline. */
  protected abstract compose(outline: LetterOutline): Promise<LetterDraft>;

  protected validate({ profile, application }: GenerationRequest): void {
    if (!profile.fullName.trim()) {
      throw new CoverLetterError("Add your name in Hero before generating a cover letter.");
    }
    if (!application.companyName.trim() || !application.positionTitle.trim()) {
      throw new CoverLetterError("Company name and position title are required.");
    }
    const description = application.jobDescription.trim();
    if (!description || description.length > JOB_APPLICATION_LIMITS.jobDescription) {
      throw new CoverLetterError(
        `Paste a job description of up to ${JOB_APPLICATION_LIMITS.jobDescription.toLocaleString()} characters.`
      );
    }
  }

  protected buildOutline(request: GenerationRequest): LetterOutline {
    const { profile, application, report } = request;
    const current = profile.experiences.find((experience) => experience.current);
    const technologies = report.matches
      .filter(({ requirement }) => requirement.kind === "skill" || requirement.kind === "tool")
      .map(({ requirement }) => requirement.term);
    const fitTechnologies = technologies.slice(0, FIT_TECHNOLOGIES);
    const highlights = this.selectHighlights(profile, report.highlights, application.length);
    const named = new Set([...fitTechnologies, ...highlights.flatMap((h) => h.technologies)]);
    return {
      request,
      currentRole: current ? { role: current.role, company: current.company } : null,
      fitTechnologies,
      highlights,
      additionalTechnologies: technologies
        .filter((term) => !named.has(term))
        .slice(0, ADDITIONAL_TECHNOLOGIES),
      softSkills: report.matches
        .filter(({ requirement }) => requirement.kind === "softSkill")
        .slice(0, SOFT_SKILLS)
        .map(({ requirement }) => requirement.term),
      band: LetterLengthPolicy.band(application.length),
    };
  }

  /** Ranked matches first, then the most recent roles and projects to fill the slots. */
  private selectHighlights(
    profile: ApplicantProfile,
    ranked: readonly RankedHighlight[],
    length: LetterLength
  ): OutlineHighlight[] {
    const fillers: RankedHighlight[] = [
      ...profile.experiences.map((_, index) => ({ source: "experience" as const, index })),
      ...profile.projects.map((_, index) => ({ source: "project" as const, index })),
    ].map((ref) => ({ ...ref, label: "", matchedTechnologies: [], score: 0 }));

    const chosen: RankedHighlight[] = [];
    for (const candidate of [...ranked, ...fillers]) {
      if (chosen.length === HIGHLIGHTS[length]) break;
      if (!chosen.some((c) => c.source === candidate.source && c.index === candidate.index)) {
        chosen.push(candidate);
      }
    }
    return chosen.map((highlight) => this.toOutlineHighlight(profile, highlight, length));
  }

  private toOutlineHighlight(
    profile: ApplicantProfile,
    { source, index, matchedTechnologies }: RankedHighlight,
    length: LetterLength
  ): OutlineHighlight {
    const pick = (tags: readonly string[]): string[] =>
      (matchedTechnologies.length > 0
        ? matchedTechnologies
        : tags.map((tag) => this.deps.lexicon.normalize(tag))
      ).slice(0, HIGHLIGHT_TECHNOLOGIES);
    const details = (prose: string): string[] =>
      CoverLetterGenerator.leadingSentences(prose, DETAILS_PER_HIGHLIGHT[length]);

    if (source === "experience") {
      const experience = profile.experiences[index];
      return {
        source,
        name: experience.role,
        organization: experience.company,
        technologies: pick(experience.technologies),
        details: details(experience.description),
      };
    }
    const project = profile.projects[index];
    return {
      source,
      name: project.title,
      technologies: pick(project.technologies),
      details: details(`${project.summary}\n${project.description}`),
    };
  }

  /** Joins sentences into paragraphs; a paragraph emptied by the guards cannot be sent. */
  private toBody(draft: LetterDraft, removedTerms: string[]): Paragraph[] {
    const body = draft.paragraphs.map((paragraph) =>
      LetterText.merge(
        paragraph.flatMap((item, index) =>
          index === 0 ? item.runs : [{ text: " " }, ...item.runs]
        )
      )
    );
    if (body.length !== BODY_PARAGRAPHS || body.some((paragraph) => paragraph.length === 0)) {
      if (removedTerms.length > 0) throw new HonestyViolationError(removedTerms);
      throw new CoverLetterError(
        "The letter could not be written from this profile. Please try again."
      );
    }
    return body;
  }

  /**
   * Complete sentences from the start of a description that read in the first
   * person ("I led…", or "Led…" which becomes "I led…"). Bullets and sentences
   * that would not fit the letter's voice are skipped.
   */
  private static leadingSentences(text: string, count: number): string[] {
    const prose = text
      .split(/\r?\n/)
      .map((line) => line.replace(/^\s*(?:[-*•·]|\d{1,2}[.)])\s+/, "").trim())
      .filter(Boolean)
      .join(" ");
    const sentences = prose.match(/\S.*?[.!?](?=\s+["“(]?[A-Z0-9]|\s*$)/g) ?? [];
    return sentences
      .map((s) => CoverLetterGenerator.asFirstPerson(s.trim()))
      .filter((s): s is string => s !== null && s.length <= MAX_DETAIL_LENGTH)
      .slice(0, count);
  }

  private static asFirstPerson(text: string): string | null {
    if (/^(?:I|We)\s/.test(text)) return text;
    const [verb] = text.split(/\s/, 1);
    if (/^[A-Z][a-z]+ed$/.test(verb) || PAST_TENSE_VERBS.has(verb)) {
      return `I ${verb.toLowerCase()}${text.slice(verb.length)}`;
    }
    return null;
  }

  /** All profile prose, used to tell the applicant's own numbers from invented ones. */
  private static profileText(profile: ApplicantProfile): string {
    return [
      profile.summary,
      ...profile.experiences.map((experience) => experience.description),
      ...profile.projects.flatMap((project) => [project.summary, project.description]),
    ].join("\n");
  }
}
