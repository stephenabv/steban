import type {
  CoverLetter,
  CoverLetterContent,
  CoverLetterStatus,
  GeneratorStrategy,
  JobApplication,
  JobApplicationContent,
  RegenerationOptions,
} from "@/server/domain/coverLetter";

/** A letter with the application it was written for. */
export interface CoverLetterRecord {
  letter: CoverLetter;
  application: JobApplication;
}

/** List row: enough for the table, without the private job description or letter text. */
export interface CoverLetterSummary {
  id: string;
  status: CoverLetterStatus;
  generator: GeneratorStrategy;
  companyName: string;
  positionTitle: string;
  letterDate: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewCoverLetter {
  application: JobApplicationContent;
  content: CoverLetterContent;
}

export interface CoverLetterPatch {
  content?: Partial<CoverLetterContent>;
  status?: CoverLetterStatus;
  application?: Partial<RegenerationOptions>;
}

export const COVER_LETTER_LIST_LIMIT = 200;

/**
 * Storage for cover letters and their applications. Every method is scoped
 * by owner: a record belonging to another owner behaves exactly like a
 * missing one. Not a BaseRepository: that contract has no owner parameter.
 */
export abstract class CoverLetterRepository {
  /** Creates the application and its letter (as a draft) together. */
  abstract create(ownerId: string, input: NewCoverLetter): Promise<CoverLetterRecord>;

  abstract findById(ownerId: string, id: string): Promise<CoverLetterRecord | null>;

  /** Most recently updated first, at most COVER_LETTER_LIST_LIMIT rows. */
  abstract list(ownerId: string): Promise<CoverLetterSummary[]>;

  /**
   * Conditional write: applies only while the letter's status is one of
   * `allowedStatuses`, and returns null otherwise (or when missing), so two
   * tabs cannot, for example, edit a letter that was just finalized.
   */
  abstract update(
    ownerId: string,
    id: string,
    patch: CoverLetterPatch,
    allowedStatuses: readonly CoverLetterStatus[]
  ): Promise<CoverLetterRecord | null>;

  /** Deletes the letter and its application. */
  abstract delete(ownerId: string, id: string): Promise<boolean>;

  protected static summarize({ letter, application }: CoverLetterRecord): CoverLetterSummary {
    return {
      id: letter.id,
      status: letter.status,
      generator: letter.generator,
      companyName: application.companyName,
      positionTitle: application.positionTitle,
      letterDate: application.letterDate,
      createdAt: letter.createdAt,
      updatedAt: letter.updatedAt,
    };
  }
}
