import { z } from "zod";
import {
  EXPORT_FORMATS,
  GENERATOR_STRATEGIES,
  JOB_APPLICATION_LIMITS as LIMITS,
  LETTER_LENGTHS,
  LETTER_TONES,
  LetterText,
  WORK_MODES,
} from "@/server/domain/coverLetter";

/*
 * Cover letter validation, shared by the form (client) and the server
 * actions. Objects are strict, so unexpected fields are rejected rather than
 * silently dropped. Keep this module free of server-only imports.
 */

const text = (max: number, label = "This field") =>
  z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max.toLocaleString("en-US")} characters.`);
const requiredText = (label: string, max: number) =>
  text(max, label).min(1, `${label} is required.`);
/** Empty input means "not provided". */
const optionalText = (label: string, max: number) =>
  text(max, label).transform((value) => value || undefined);

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

function isCalendarDate(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

const letterDate = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || (/^\d{4}-\d{2}-\d{2}$/.test(value) && isCalendarDate(value)),
    "Enter a valid date."
  )
  .transform((value) => value || undefined);

const tone = z.enum(LETTER_TONES, { message: "Choose a tone." });
const length = z.enum(LETTER_LENGTHS, { message: "Choose a length." });
const strategy = z.enum(GENERATOR_STRATEGIES, { message: "Choose a generator." });

export const jobApplicationSchema = z.strictObject({
  companyName: requiredText("Company name", LIMITS.companyName),
  companyLocation: optionalText("Company location", LIMITS.companyLocation),
  /** Empty means the default, "Hiring Manager". */
  hiringManager: text(LIMITS.hiringManager, "Hiring manager"),
  positionTitle: requiredText("Position title", LIMITS.positionTitle),
  workArrangement: z.strictObject({
    mode: z.enum(WORK_MODES, { message: "Choose a work arrangement." }),
    schedule: text(LIMITS.schedule, "Schedule"),
  }),
  jobDescription: requiredText("Job description", LIMITS.jobDescription),
  industryContext: optionalText("Client or industry context", LIMITS.industryContext),
  /** Kept as a reference only; the server never fetches it. */
  postingUrl: text(LIMITS.postingUrl, "Job posting URL")
    .refine((value) => value === "" || isHttpUrl(value), "Enter a full URL starting with https://")
    .transform((value) => value || undefined),
  letterDate,
  tone,
  length,
});

export const generateCoverLetterSchema = z.strictObject({
  application: jobApplicationSchema,
  strategy,
});

export const regenerateCoverLetterSchema = z.strictObject({ strategy, tone, length });

export const COVER_LETTER_EDIT_LIMITS = {
  date: 60,
  salutation: 160,
  paragraph: 2_000,
  maxParagraphs: 6,
} as const;

/** Body paragraphs arrive as `**bold**` markup and leave as structured runs. */
export const coverLetterEditSchema = z.strictObject({
  date: requiredText("Date", COVER_LETTER_EDIT_LIMITS.date),
  salutation: requiredText("Salutation", COVER_LETTER_EDIT_LIMITS.salutation),
  body: z
    .array(requiredText("Paragraph", COVER_LETTER_EDIT_LIMITS.paragraph))
    .min(1, "The letter needs at least one paragraph.")
    .max(COVER_LETTER_EDIT_LIMITS.maxParagraphs, "Keep the letter to a few short paragraphs.")
    .transform((paragraphs) => paragraphs.map((paragraph) => LetterText.parseMarkup(paragraph))),
});

export const coverLetterIdSchema = z.uuid();
export const exportFormatSchema = z.enum(EXPORT_FORMATS);

export type JobApplicationFormInput = z.input<typeof jobApplicationSchema>;
export type GenerateCoverLetterInput = z.input<typeof generateCoverLetterSchema>;
export type RegenerateCoverLetterInput = z.input<typeof regenerateCoverLetterSchema>;
export type CoverLetterEditInput = z.input<typeof coverLetterEditSchema>;
