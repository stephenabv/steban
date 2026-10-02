import type {
  ApplicantProfile,
  CoverLetterSections,
  GeneratorStrategy,
  JobApplicationContent,
  MatchReport,
  TextRun,
  WordBand,
} from "@/server/domain/coverLetter";

/** Everything a generator needs; the profile and match report are computed by the service. */
export interface GenerationRequest {
  profile: ApplicantProfile;
  application: JobApplicationContent;
  report: MatchReport;
}

export interface DraftSentence {
  runs: TextRun[];
  /** May be dropped to meet the word limit. */
  optional?: boolean;
}

/** Body text before guards and length rules run: three paragraphs of sentences. */
export interface LetterDraft {
  paragraphs: DraftSentence[][];
}

export interface OutlineHighlight {
  source: "experience" | "project";
  /** Role for experience, title for a project. */
  name: string;
  /** Company for experience; absent for projects. */
  organization?: string;
  /** Up to three technologies, all from the profile. */
  technologies: string[];
  /** Leading sentences of the role or project description (none, one or two by length). */
  details: string[];
}

/** The plan both generators write from. Built once per request by the base class. */
export interface LetterOutline {
  request: GenerationRequest;
  currentRole: { role: string; company: string } | null;
  /** The strongest matched technologies for the one-line fit. */
  fitTechnologies: string[];
  highlights: OutlineHighlight[];
  /** Other matched technologies the fit line and highlights don't already name. */
  additionalTechnologies: string[];
  /** Matched soft skills the profile shows evidence for. */
  softSkills: string[];
  band: WordBand;
}

export interface GeneratedLetter {
  /** The strategy that actually wrote the letter (after any fallback). */
  strategy: GeneratorStrategy;
  sections: CoverLetterSections;
  plainText: string;
  wordCount: number;
  /** Technologies the honesty guard removed. */
  removedTerms: string[];
  /** Messages for the admin, e.g. a fallback notice. */
  notices: string[];
}

/** Builds a sentence from plain strings and `{ bold }` highlights. */
export function sentence(
  parts: ReadonlyArray<string | { bold: string }>,
  optional = false
): DraftSentence {
  const runs = parts
    .map((part): TextRun =>
      typeof part === "string" ? { text: part } : { text: part.bold, bold: true }
    )
    .filter((run) => run.text);
  return optional ? { runs, optional } : { runs };
}

/** "A", "A and B", "A, B and C" with each item bold. */
export function boldList(items: readonly string[]): Array<string | { bold: string }> {
  return items.flatMap((item, index) => {
    const separator = index === 0 ? "" : index === items.length - 1 ? " and " : ", ";
    return separator ? [separator, { bold: item }] : [{ bold: item }];
  });
}
