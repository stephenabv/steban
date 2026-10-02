import type { CoverLetterSections } from "@/server/domain/coverLetter";

export const EXPORT_FORMATS = ["pdf", "docx", "txt"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export interface ExportableLetter {
  sections: CoverLetterSections;
  companyName: string;
  positionTitle: string;
}

export interface ExportedFile {
  bytes: Uint8Array;
  mimeType: string;
  filename: string;
}

/** Filename-safe slug: ASCII letters, digits and single dashes. */
const slug = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 60)
    .toLowerCase();

/**
 * One output format. The base class names the file; subclasses only render
 * bytes from the structured sections.
 */
export abstract class CoverLetterExporter {
  abstract readonly format: ExportFormat;
  abstract readonly mimeType: string;

  async export(letter: ExportableLetter): Promise<ExportedFile> {
    return {
      bytes: await this.render(letter.sections),
      mimeType: this.mimeType,
      filename: this.filename(letter),
    };
  }

  protected abstract render(sections: CoverLetterSections): Promise<Uint8Array>;

  private filename({ sections, companyName, positionTitle }: ExportableLetter): string {
    const base = [sections.signature, companyName, positionTitle]
      .map(slug)
      .filter(Boolean)
      .join("_");
    return `${base || "cover-letter"}.${this.format}`;
  }
}
