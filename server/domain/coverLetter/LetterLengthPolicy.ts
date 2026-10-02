import type { LetterLength } from "./JobApplication";

export type LengthFit = "under" | "within" | "over";

export interface WordBand {
  min: number;
  max: number;
}

const BANDS: Record<LetterLength, WordBand> = {
  concise: { min: 150, max: 200 },
  standard: { min: 250, max: 350 },
};

/** Body word-count targets per letter length. */
export class LetterLengthPolicy {
  static band(length: LetterLength): WordBand {
    return BANDS[length];
  }

  /** Where a body word count falls relative to the target band. */
  static assess(length: LetterLength, words: number): LengthFit {
    const { min, max } = BANDS[length];
    if (words < min) return "under";
    return words > max ? "over" : "within";
  }
}
