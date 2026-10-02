import { Document, Packer, Paragraph as DocxParagraph, TextRun as DocxTextRun } from "docx";
import type { CoverLetterSections, Paragraph } from "@/server/domain/coverLetter";
import { CoverLetterExporter } from "./CoverLetterExporter";

const FONT = "Calibri";
const SIZE = 22; // half-points: 11pt
const BLOCK_SPACING = 240; // twentieths of a point: 12pt after each block

const line = (text: string, spaced = false): DocxParagraph =>
  new DocxParagraph({
    children: [new DocxTextRun({ text, font: FONT, size: SIZE })],
    spacing: { after: spaced ? BLOCK_SPACING : 0 },
  });

const lines = (texts: readonly string[]): DocxParagraph[] =>
  texts.map((text, index) => line(text, index === texts.length - 1));

const bodyParagraph = (paragraph: Paragraph): DocxParagraph =>
  new DocxParagraph({
    children: paragraph.map(
      (run) => new DocxTextRun({ text: run.text, bold: run.bold, font: FONT, size: SIZE })
    ),
    spacing: { after: BLOCK_SPACING },
  });

/** Word document with plain paragraphs; bold is the only formatting. */
export class DocxExporter extends CoverLetterExporter {
  readonly format = "docx";
  readonly mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  protected async render(sections: CoverLetterSections): Promise<Uint8Array> {
    const [thanks, ...signOff] = sections.closing;
    const document = new Document({
      creator: sections.signature,
      title: "Cover letter",
      sections: [
        {
          children: [
            ...lines([sections.header.fullName, ...sections.header.lines]),
            line(sections.date, true),
            ...lines(sections.recipient),
            line(sections.salutation, true),
            ...sections.body.map(bodyParagraph),
            line(thanks, true),
            ...lines([...signOff, sections.signature]),
          ],
        },
      ],
    });
    return new Uint8Array(await Packer.toBuffer(document));
  }
}
