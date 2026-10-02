import type { MatchReport } from "./RequirementMatch";

export const COVER_LETTER_STATUSES = ["draft", "final"] as const;
export type CoverLetterStatus = (typeof COVER_LETTER_STATUSES)[number];

export const GENERATOR_STRATEGIES = ["template", "ai"] as const;
export type GeneratorStrategy = (typeof GENERATOR_STRATEGIES)[number];

/** Download formats offered for a letter. */
export const EXPORT_FORMATS = ["pdf", "docx", "txt"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const CLOSING_LINES = ["Thank you for your time and consideration.", "Sincerely,"] as const;

/** A span of letter text. Bold is the only formatting a letter may carry. */
export interface TextRun {
  text: string;
  bold?: boolean;
}

export type Paragraph = TextRun[];

export interface CoverLetterSections {
  header: {
    fullName: string;
    /** Email, portfolio, GitHub, LinkedIn: whichever the profile has. */
    lines: string[];
  };
  /** Formatted for display, e.g. "October 2, 2026". */
  date: string;
  /** Hiring manager, company, location. */
  recipient: string[];
  salutation: string;
  /** Three short paragraphs. */
  body: Paragraph[];
  closing: string[];
  signature: string;
}

export interface CoverLetter {
  id: string;
  ownerId: string;
  applicationId: string;
  generator: GeneratorStrategy;
  status: CoverLetterStatus;
  sections: CoverLetterSections;
  plainText: string;
  matchReport: MatchReport;
  createdAt: Date;
  updatedAt: Date;
}

/** Fields written when a letter is created or regenerated. */
export type CoverLetterContent = Pick<
  CoverLetter,
  "generator" | "sections" | "plainText" | "matchReport"
>;

/** Editable parts of a saved letter; header, recipient and signature always come from data. */
export interface CoverLetterEdit {
  date: string;
  salutation: string;
  body: Paragraph[];
}
