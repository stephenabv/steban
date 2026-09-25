/** Resume upload limits — shared by the server policy and the admin UI. */
export const RESUME_LIMITS = {
  /** Kept under Vercel's 4.5 MB function request-body limit so every accepted file can arrive. */
  maxBytes: 4 * 1024 * 1024,
  contentType: "application/pdf",
  extension: ".pdf",
  maxFileNameLength: 120,
} as const;
