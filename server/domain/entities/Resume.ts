/** Metadata for an uploaded resume file (content is loaded separately). */
export interface ResumeFile {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  /** SHA-256 of the content — used as the HTTP ETag and for cache-busting links. */
  sha256: string;
  uploadedAt: Date;
}

export interface ResumeFileContent extends ResumeFile {
  content: Buffer;
}

export interface CreateResumeFileInput {
  fileName: string;
  contentType: string;
  content: Buffer;
  sha256: string;
}
