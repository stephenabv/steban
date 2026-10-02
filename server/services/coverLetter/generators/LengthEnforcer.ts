import type { WordBand } from "@/server/domain/coverLetter";
import { LetterText } from "@/server/domain/coverLetter";
import type { DraftSentence, LetterDraft } from "./LetterDraft";

/** Paragraph order in which optional sentences go: evidence first, opening last. */
const TRIM_ORDER = [1, 2, 0] as const;
const EVIDENCE_PARAGRAPH = 1;

const sentenceWords = (item: DraftSentence): number =>
  LetterText.wordCount(LetterText.paragraphText(item.runs));

/**
 * Brings a draft under its word band's maximum: optional sentences go first
 * (last first), then extra evidence sentences. Never empties a paragraph and
 * never touches the opening line or the call to action.
 */
export class LengthEnforcer {
  fit(draft: LetterDraft, band: WordBand): LetterDraft {
    const paragraphs = draft.paragraphs.map((paragraph) => [...paragraph]);
    const isOver = () =>
      paragraphs.flat().reduce((total, item) => total + sentenceWords(item), 0) > band.max;

    for (const index of TRIM_ORDER) {
      this.trim(paragraphs[index], isOver, (item) => item.optional === true);
    }
    this.trim(paragraphs[EVIDENCE_PARAGRAPH], isOver, () => true);
    return { paragraphs };
  }

  private trim(
    paragraph: DraftSentence[] | undefined,
    isOver: () => boolean,
    removable: (item: DraftSentence) => boolean
  ): void {
    if (!paragraph) return;
    for (let i = paragraph.length - 1; i >= 0 && isOver(); i--) {
      if (paragraph.length > 1 && removable(paragraph[i])) paragraph.splice(i, 1);
    }
  }
}
