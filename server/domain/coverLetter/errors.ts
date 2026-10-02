/** A rule violation whose message is safe to show to the admin. */
export class CoverLetterError extends Error {
  override readonly name: string = "CoverLetterError";
}

/** The letter does not exist or belongs to another owner (indistinguishable on purpose). */
export class CoverLetterNotFoundError extends CoverLetterError {
  override readonly name = "CoverLetterNotFoundError";

  constructor() {
    super("This cover letter no longer exists.");
  }
}

/** Generated text named technologies the profile cannot back, and could not be repaired. */
export class HonestyViolationError extends CoverLetterError {
  override readonly name = "HonestyViolationError";

  constructor(readonly terms: readonly string[]) {
    super(`The letter mentioned technologies that are not in your profile: ${terms.join(", ")}.`);
  }
}
