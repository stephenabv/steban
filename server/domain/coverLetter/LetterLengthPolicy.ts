import type { LetterLength } from "./JobApplication";

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

  static isOver(length: LetterLength, words: number): boolean {
    return words > BANDS[length].max;
  }

  static isWithin(length: LetterLength, words: number): boolean {
    const { min, max } = BANDS[length];
    return words >= min && words <= max;
  }
}
