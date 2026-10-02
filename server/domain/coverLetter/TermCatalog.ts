export interface CatalogTerm<K extends string> {
  /** Canonical display name, e.g. "JavaScript". */
  name: string;
  /** Other spellings that normalize to `name`, e.g. "JS", "ECMAScript". */
  aliases: readonly string[];
  kind: K;
  /**
   * Match only the exact casing. Used for names that are also ordinary words
   * ("Go", "Swift", "Express") so prose like "go further" is not a mention.
   */
  caseSensitive?: boolean;
}

export interface TermMention<K extends string> {
  term: CatalogTerm<K>;
  count: number;
}

interface AliasMatcher<K extends string> {
  term: CatalogTerm<K>;
  pattern: RegExp;
  length: number;
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Letters, digits and the symbols that belong inside names like "C++" or "C#". */
const WORD_CHAR = "[\\p{L}\\p{N}+#]";

const collapse = (value: string): string => value.trim().replace(/\s+/g, " ");

/**
 * A vocabulary of named terms with synonym normalization and mention search.
 * Subclasses only declare their terms; matching rules are shared.
 */
export abstract class TermCatalog<K extends string> {
  private readonly insensitive = new Map<string, CatalogTerm<K>>();
  private readonly matchers: AliasMatcher<K>[];

  protected constructor(readonly terms: readonly CatalogTerm<K>[]) {
    const matchers: AliasMatcher<K>[] = [];
    for (const term of terms) {
      for (const alias of [term.name, ...term.aliases]) {
        const key = collapse(alias);
        // Normalizing a stored tag ignores case; only mention search honours caseSensitive.
        if (!this.insensitive.has(key.toLowerCase())) this.insensitive.set(key.toLowerCase(), term);
        matchers.push({
          term,
          length: key.length,
          pattern: new RegExp(
            `(?<!${WORD_CHAR})${escapeRegExp(key).replace(/ /g, "\\s+")}(?!${WORD_CHAR})`,
            term.caseSensitive ? "gu" : "giu"
          ),
        });
      }
    }
    // Longest alias first so "React Native" wins over "React" and "Git/GitHub" over "Git".
    this.matchers = matchers.sort((a, b) => b.length - a.length);
  }

  /** The catalog term for a name or alias (any case), or null when unknown. */
  find(raw: string): CatalogTerm<K> | null {
    const key = collapse(raw);
    return this.insensitive.get(key.toLowerCase()) ?? null;
  }

  /** Canonical name for a known term; unknown terms come back trimmed so profile data is never lost. */
  normalize(raw: string): string {
    return this.find(raw)?.name ?? collapse(raw);
  }

  /**
   * Every term mentioned in `text`, with occurrence counts. Matched spans are
   * masked so a longer alias is never counted again as a shorter one.
   */
  findMentions(text: string): TermMention<K>[] {
    let remaining = text;
    const counts = new Map<CatalogTerm<K>, number>();
    for (const { term, pattern } of this.matchers) {
      remaining = remaining.replace(pattern, (match) => {
        counts.set(term, (counts.get(term) ?? 0) + 1);
        return " ".repeat(match.length);
      });
    }
    return [...counts].map(([term, count]) => ({ term, count }));
  }
}
