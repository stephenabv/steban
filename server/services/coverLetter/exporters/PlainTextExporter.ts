import type { CoverLetterSections } from "@/server/domain/coverLetter";
import { LetterText } from "@/server/domain/coverLetter";
import { CoverLetterExporter } from "./CoverLetterExporter";

export class PlainTextExporter extends CoverLetterExporter {
  readonly format = "txt";
  readonly mimeType = "text/plain; charset=utf-8";

  protected async render(sections: CoverLetterSections): Promise<Uint8Array> {
    return new TextEncoder().encode(`${LetterText.toPlainText(sections)}\n`);
  }
}
