import type { CoverLetterSections, Paragraph, TextRun } from "./CoverLetter";

const BOLD_MARKER = "**";

/**
 * Conversions between structured letter text and its plain forms. The only
 * markup is `**bold**`; everything else is literal text and is always
 * rendered as text, never HTML.
 */
export class LetterText {
  static paragraphText(paragraph: Paragraph): string {
    return paragraph.map((run) => run.text).join("");
  }

  /** `**bold**` markup → runs. An unclosed marker is kept as literal text. */
  static parseMarkup(markup: string): Paragraph {
    const parts = markup.split(BOLD_MARKER);
    if (parts.length % 2 === 0) {
      const unclosed = parts.pop() ?? "";
      parts[parts.length - 1] += `${BOLD_MARKER}${unclosed}`;
    }
    return LetterText.merge(
      parts.map((text, index) => (index % 2 === 1 ? { text, bold: true } : { text }))
    );
  }

  static toMarkup(paragraph: Paragraph): string {
    return paragraph
      .map((run) => (run.bold ? `${BOLD_MARKER}${run.text}${BOLD_MARKER}` : run.text))
      .join("");
  }

  /** Joins adjacent runs with the same weight and drops empty ones. */
  static merge(runs: TextRun[]): Paragraph {
    const merged: TextRun[] = [];
    for (const run of runs) {
      if (!run.text) continue;
      const last = merged.at(-1);
      if (last && Boolean(last.bold) === Boolean(run.bold)) last.text += run.text;
      else merged.push(run.bold ? { text: run.text, bold: true } : { text: run.text });
    }
    return merged;
  }

  static wordCount(text: string): number {
    return text.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
  }

  static bodyWordCount(body: readonly Paragraph[]): number {
    return body.reduce(
      (total, paragraph) => total + LetterText.wordCount(LetterText.paragraphText(paragraph)),
      0
    );
  }

  /** The whole letter as plain text (no markup), blocks separated by blank lines. */
  static toPlainText(sections: CoverLetterSections): string {
    const [thanks, ...signOff] = sections.closing;
    const blocks = [
      [sections.header.fullName, ...sections.header.lines].join("\n"),
      sections.date,
      sections.recipient.join("\n"),
      sections.salutation,
      ...sections.body.map(LetterText.paragraphText),
      thanks,
      [...signOff, sections.signature].join("\n"),
    ];
    return blocks.filter((block) => block && block.trim()).join("\n\n");
  }
}
