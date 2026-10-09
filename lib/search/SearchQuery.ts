/**
 * A normalized free-text query with relevance scoring.
 *
 * Shared by the server (record search) and the browser (page commands) so
 * both rank results the same way. Every term must appear in at least one
 * field; matches in heavier fields, at a word start, or on the whole field
 * rank higher.
 */

export interface SearchField {
  text: string | undefined;
  /** Relative importance, e.g. 3 for a title, 1 for body text. */
  weight: number;
}

const SCORE = {
  exact: 6,
  prefix: 4,
  wordStart: 2,
  contains: 1,
} as const;

const WORD_BOUNDARY = /[\s\-_/.@&(]/;

export class SearchQuery {
  static readonly MIN_LENGTH = 2;
  static readonly MAX_LENGTH = 80;
  private static readonly MAX_TERMS = 6;

  private constructor(
    readonly text: string,
    readonly terms: readonly string[]
  ) {}

  /** Returns null for input that is not a string or is too short to search on. */
  static parse(raw: unknown): SearchQuery | null {
    if (typeof raw !== "string") return null;
    const text = raw.normalize("NFKC").replace(/\s+/g, " ").trim().slice(0, SearchQuery.MAX_LENGTH);
    if (text.length < SearchQuery.MIN_LENGTH) return null;
    const terms = [...new Set(text.toLowerCase().split(" "))].slice(0, SearchQuery.MAX_TERMS);
    return new SearchQuery(text, terms);
  }

  /** 0 when any term is missing from every field; otherwise a positive rank. */
  score(fields: readonly SearchField[]): number {
    const haystacks = fields
      .filter((f): f is SearchField & { text: string } => Boolean(f.text))
      .map((f) => ({ text: f.text.toLowerCase(), weight: f.weight }));

    let total = 0;
    for (const term of this.terms) {
      let best = 0;
      for (const { text, weight } of haystacks) {
        best = Math.max(best, SearchQuery.matchStrength(text, term) * weight);
      }
      if (best === 0) return 0;
      total += best;
    }
    const whole = this.text.toLowerCase();
    for (const { text, weight } of haystacks) {
      if (text === whole) total += SCORE.exact * weight;
    }
    return total;
  }

  private static matchStrength(text: string, term: string): number {
    let index = text.indexOf(term);
    if (index === -1) return 0;
    if (index === 0) return SCORE.prefix;
    // A later occurrence may start a word even when the first one doesn't.
    for (; index !== -1; index = text.indexOf(term, index + 1)) {
      if (WORD_BOUNDARY.test(text[index - 1])) return SCORE.wordStart;
    }
    return SCORE.contains;
  }
}
