/**
 * Upload rules shared by the server-side file policies (authoritative) and the
 * admin UI (fast pre-checks). Kept free of server-only imports.
 */
export interface UploadLimits {
  /** Kept under Vercel's 4.5 MB function request-body limit so every accepted file can arrive. */
  maxBytes: number;
  /** MIME types the admin picker offers; the server checks the bytes, not these. */
  contentTypes: readonly string[];
  extensions: readonly string[];
  /** Human-readable list of accepted formats for hints and errors. */
  typeLabel: string;
  maxFileNameLength: number;
  /** Stem used when an uploaded name sanitises to nothing. */
  fallbackName: string;
}

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export const RESUME_LIMITS = {
  maxBytes: MAX_UPLOAD_BYTES,
  contentTypes: ["application/pdf"],
  extensions: [".pdf"],
  typeLabel: "PDF",
  maxFileNameLength: 120,
  fallbackName: "resume",
} as const satisfies UploadLimits;

/** SVG is deliberately excluded: it can carry script. */
export const PROFILE_PHOTO_LIMITS = {
  maxBytes: MAX_UPLOAD_BYTES,
  contentTypes: ["image/jpeg", "image/png", "image/webp"],
  extensions: [".jpg", ".jpeg", ".png", ".webp"],
  typeLabel: "JPEG, PNG or WebP",
  maxFileNameLength: 120,
  fallbackName: "profile-photo",
} as const satisfies UploadLimits;

/** Value for an `<input type="file" accept>` attribute. */
export function acceptAttribute(limits: UploadLimits): string {
  return [...limits.contentTypes, ...limits.extensions].join(",");
}
