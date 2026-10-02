import { LetterText } from "@/server/domain/coverLetter";
import type { LetterDraft } from "./LetterDraft";

/** Phrases a letter must not use (lower case). */
export const BANNED_PHRASES: readonly string[] = [
  "i am writing to express",
  "i'm writing to express",
  "keen interest",
  "passionate",
  "team player",
  "go-getter",
  "think outside the box",
  "synergy",
  "hit the ground running",
  "results-driven",
  "proven track record",
  "wealth of experience",
  "perfect fit",
  "rockstar",
  "ninja",
  "guru",
  "hard-working",
  "hardworking",
  "leverage my skills",
  "dynamic environment",
];

/** A number presented as an achievement: "40%", "3x", "$2M", "10 percent". */
const METRIC = /(?:\$\s?\d[\d,.]*\s?[kmb]?|\d[\d,.]*\s?(?:%|percent\b|x\b|×))/giu;

/**
 * Keeps prose plain and confident: drops sentences with clichés or with
 * metrics the profile does not state, and replaces em dashes.
 */
export class StyleGuard {
  constructor(private readonly banned: readonly string[] = BANNED_PHRASES) {}

  /** `profileText` is every piece of profile prose; a metric found there is the applicant's own. */
  clean(draft: LetterDraft, profileText: string): LetterDraft {
    const source = profileText.toLowerCase();
    const paragraphs = draft.paragraphs.map((paragraph) =>
      paragraph
        .filter((item) => {
          const text = LetterText.paragraphText(item.runs).toLowerCase();
          return !this.hasCliche(text) && !this.hasInventedMetric(text, source);
        })
        .map((item) => ({
          ...item,
          runs: item.runs.map((run) => ({ ...run, text: StyleGuard.replaceDashes(run.text) })),
        }))
    );
    return { paragraphs };
  }

  hasCliche(text: string): boolean {
    const lower = text.toLowerCase();
    return this.banned.some((phrase) => lower.includes(phrase));
  }

  private hasInventedMetric(text: string, profileText: string): boolean {
    return (text.match(METRIC) ?? []).some((metric) => !profileText.includes(metric.trim()));
  }

  private static replaceDashes(text: string): string {
    return text.replace(/\s*—\s*/g, ", ");
  }
}
