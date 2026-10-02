import type { CoverLetterSections } from "@/server/domain/coverLetter";
import { LetterText } from "@/server/domain/coverLetter";
import type { CoverLetterEditInput } from "@/server/security/coverLetterSchemas";

/** The editable parts of a letter as plain strings, with body bold as `**markup**`. */
export interface CoverLetterDraftValues {
  date: string;
  salutation: string;
  body: string[];
}

/** Converts between saved letter sections and the editor's text fields. */
export class CoverLetterDraft {
  static fromSections(sections: CoverLetterSections): CoverLetterDraftValues {
    return {
      date: sections.date,
      salutation: sections.salutation,
      body: sections.body.map((paragraph) => LetterText.toMarkup(paragraph)),
    };
  }

  static toInput(values: CoverLetterDraftValues): CoverLetterEditInput {
    return { date: values.date, salutation: values.salutation, body: values.body };
  }

  /** Saved sections with the draft applied, for the live preview, copy and word count. */
  static applyTo(
    sections: CoverLetterSections,
    values: CoverLetterDraftValues
  ): CoverLetterSections {
    return {
      ...sections,
      date: values.date,
      salutation: values.salutation,
      body: values.body.map((markup) => LetterText.parseMarkup(markup)),
    };
  }

  static equals(a: CoverLetterDraftValues, b: CoverLetterDraftValues): boolean {
    return (
      a.date === b.date &&
      a.salutation === b.salutation &&
      a.body.length === b.body.length &&
      a.body.every((paragraph, index) => paragraph === b.body[index])
    );
  }
}
