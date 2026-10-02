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

/** Targets are approximate ("about 250 words"), so a letter slightly short of the band still fits. */
const UNDER_TOLERANCE = 0.9;

/** Body word-count targets per letter length. */
export class LetterLengthPolicy {
  static band(length: LetterLength): WordBand {
    return BANDS[length];
  }

  /** Where a body word count falls relative to the target band. */
  static assess(length: LetterLength, words: number): LengthFit {
    const { min, max } = BANDS[length];
    if (words < Math.floor(min * UNDER_TOLERANCE)) return "under";
    return words > max ? "over" : "within";
  }
}
