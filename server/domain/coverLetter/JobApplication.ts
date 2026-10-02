/** How the role is worked. */
export const WORK_MODES = ["onsite", "hybrid", "remote"] as const;
export type WorkMode = (typeof WORK_MODES)[number];

export const LETTER_TONES = ["professional", "warm"] as const;
export type LetterTone = (typeof LETTER_TONES)[number];

/** `concise` ≈ 150–200 body words, `standard` ≈ 250–350 (see LetterLengthPolicy). */
export const LETTER_LENGTHS = ["concise", "standard"] as const;
export type LetterLength = (typeof LETTER_LENGTHS)[number];

export const DEFAULT_HIRING_MANAGER = "Hiring Manager";

/** Calendar dates are kept as `YYYY-MM-DD` so a letter never shifts a day across time zones. */
export const LETTER_TIME_ZONE = "Asia/Manila";

export const JOB_APPLICATION_LIMITS = {
  companyName: 200,
  companyLocation: 200,
  hiringManager: 120,
  positionTitle: 200,
  schedule: 200,
  jobDescription: 20_000,
  industryContext: 1_000,
  postingUrl: 2_048,
} as const;

export interface WorkArrangement {
  mode: WorkMode;
  /** Free text such as "9am–6pm UK time"; empty when not specified. */
  schedule: string;
}

/** What the admin types in for one application. Everything about the applicant comes from the profile. */
export interface JobApplicationContent {
  companyName: string;
  companyLocation?: string;
  hiringManager: string;
  positionTitle: string;
  workArrangement: WorkArrangement;
  /** Untrusted pasted text: never rendered as HTML, passed to an LLM only as delimited data. */
  jobDescription: string;
  industryContext?: string;
  /** Stored as a reference only. It is never fetched server-side (SSRF). */
  postingUrl?: string;
  /** `YYYY-MM-DD`. */
  letterDate: string;
  tone: LetterTone;
  length: LetterLength;
}

export interface JobApplication extends JobApplicationContent {
  id: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Fields the admin can change when regenerating a letter. */
export type RegenerationOptions = Pick<JobApplicationContent, "tone" | "length">;
