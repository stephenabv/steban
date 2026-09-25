/** Metadata for an uploaded file that occupies a single slot (e.g. the resume). */
export interface ManagedFile {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  /** SHA-256 of the content — used as the HTTP ETag and to version public URLs. */
  sha256: string;
  uploadedAt: Date;
}

export interface ManagedFileContent extends ManagedFile {
  content: Buffer;
}

export interface CreateManagedFileInput {
  fileName: string;
  contentType: string;
  content: Buffer;
  sha256: string;
}
