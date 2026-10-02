import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { PDFFont, PDFPage } from "pdf-lib";
import type { CoverLetterSections, Paragraph } from "@/server/domain/coverLetter";
import { CoverLetterExporter } from "./CoverLetterExporter";

const PAGE = { width: 612, height: 792 } as const; // US Letter, points
const MARGIN = 72;
const FONT_SIZE = 11;
const LINE_HEIGHT = 15;
const BLOCK_GAP = 11;
const TEXT_COLOR = rgb(0.1, 0.1, 0.1);

interface Word {
  text: string;
  bold: boolean;
  /** False when the word continues the previous one, e.g. "." after a bold run. */
  spaceBefore: boolean;
}

const spaced = (word: Word, lineStart: boolean): string =>
  !lineStart && word.spaceBefore ? ` ${word.text}` : word.text;

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
}

/** Writes lines top to bottom, adding pages as needed. */
class PageCursor {
  private page: PDFPage;
  private y: number;

  constructor(
    private readonly document: PDFDocument,
    private readonly fonts: Fonts
  ) {
    this.page = this.addPage();
    this.y = PAGE.height - MARGIN;
  }

  get maxWidth(): number {
    return PAGE.width - MARGIN * 2;
  }

  writeLine(words: readonly Word[]): void {
    if (this.y < MARGIN + LINE_HEIGHT) {
      this.page = this.addPage();
      this.y = PAGE.height - MARGIN;
    }
    let x = MARGIN;
    words.forEach((word, index) => {
      const font = word.bold ? this.fonts.bold : this.fonts.regular;
      const text = spaced(word, index === 0);
      this.page.drawText(text, { x, y: this.y, size: FONT_SIZE, font, color: TEXT_COLOR });
      x += font.widthOfTextAtSize(text, FONT_SIZE);
    });
    this.y -= LINE_HEIGHT;
  }

  gap(): void {
    this.y -= BLOCK_GAP;
  }

  private addPage(): PDFPage {
    return this.document.addPage([PAGE.width, PAGE.height]);
  }
}

/** PDF with the standard Helvetica faces: no embedded files, no network fonts. */
export class PdfExporter extends CoverLetterExporter {
  readonly format = "pdf";
  readonly mimeType = "application/pdf";

  protected async render(sections: CoverLetterSections): Promise<Uint8Array> {
    const document = await PDFDocument.create();
    document.setTitle("Cover letter");
    document.setAuthor(sections.signature);
    const fonts: Fonts = {
      regular: await document.embedFont(StandardFonts.Helvetica),
      bold: await document.embedFont(StandardFonts.HelveticaBold),
    };
    const cursor = new PageCursor(document, fonts);
    const block = (paragraphs: readonly Paragraph[]) => {
      for (const paragraph of paragraphs) this.writeParagraph(cursor, fonts, paragraph);
      cursor.gap();
    };
    const plain = (texts: readonly string[]) => texts.map((text): Paragraph => [{ text }]);
    const [thanks, ...signOff] = sections.closing;

    block(plain([sections.header.fullName, ...sections.header.lines]));
    block(plain([sections.date]));
    block(plain(sections.recipient));
    block(plain([sections.salutation]));
    for (const paragraph of sections.body) block([paragraph]);
    block(plain([thanks]));
    block(plain([...signOff, sections.signature]));

    return document.save();
  }

  /** Greedy word wrap that keeps each word's weight. */
  private writeParagraph(cursor: PageCursor, fonts: Fonts, paragraph: Paragraph): void {
    let line: Word[] = [];
    let width = 0;
    for (const word of this.words(paragraph, fonts)) {
      const font = word.bold ? fonts.bold : fonts.regular;
      const wordWidth = font.widthOfTextAtSize(spaced(word, line.length === 0), FONT_SIZE);
      // Only break where there is a space, so punctuation stays with its word.
      if (line.length > 0 && word.spaceBefore && width + wordWidth > cursor.maxWidth) {
        cursor.writeLine(line);
        line = [];
        width = font.widthOfTextAtSize(word.text, FONT_SIZE);
      } else {
        width += wordWidth;
      }
      line.push(word);
    }
    if (line.length > 0) cursor.writeLine(line);
  }

  private words(paragraph: Paragraph, fonts: Fonts): Word[] {
    const words: Word[] = [];
    let spaceBefore = false;
    for (const run of paragraph) {
      const font = run.bold ? fonts.bold : fonts.regular;
      for (const token of PdfExporter.encodable(run.text, font).split(/(\s+)/)) {
        if (!token) continue;
        if (/^\s+$/.test(token)) {
          spaceBefore = true;
          continue;
        }
        words.push({ text: token, bold: Boolean(run.bold), spaceBefore });
        spaceBefore = false;
      }
    }
    return words;
  }

  /** Standard fonts only cover WinAnsi; anything else becomes "?" instead of failing the export. */
  private static encodable(text: string, font: PDFFont): string {
    return [...text]
      .map((char) => {
        try {
          font.encodeText(char);
          return char;
        } catch {
          return "?";
        }
      })
      .join("");
  }
}
