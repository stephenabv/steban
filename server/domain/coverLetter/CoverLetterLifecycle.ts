import type { CoverLetterStatus } from "./CoverLetter";

export type CoverLetterAction = "edit" | "regenerate" | "finalize" | "reopen";

/**
 * What may happen to a letter in each status. A final letter is frozen so the
 * version that was sent stays as it was; reopen it to change it again.
 */
const ALLOWED: Record<CoverLetterStatus, ReadonlySet<CoverLetterAction>> = {
  draft: new Set(["edit", "regenerate", "finalize"]),
  final: new Set(["reopen"]),
};

const REASONS: Record<CoverLetterAction, string> = {
  edit: "This letter is final. Reopen it as a draft to edit it.",
  regenerate: "This letter is final. Reopen it as a draft to regenerate it.",
  finalize: "This letter is already final.",
  reopen: "This letter is already a draft.",
};

export class CoverLetterLifecycle {
  static can(status: CoverLetterStatus, action: CoverLetterAction): boolean {
    return ALLOWED[status].has(action);
  }

  /** Statuses in which `action` is allowed, for race-safe conditional writes. */
  static statusesAllowing(action: CoverLetterAction): CoverLetterStatus[] {
    return (Object.keys(ALLOWED) as CoverLetterStatus[]).filter((status) =>
      ALLOWED[status].has(action)
    );
  }

  static reason(action: CoverLetterAction): string {
    return REASONS[action];
  }
}
