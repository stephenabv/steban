import type { ManagedFile } from "@/server/domain/entities";

/** Serialisable metadata for an uploaded file, shared by the admin API and UI. */
export interface ManagedFileSummary {
  fileName: string;
  contentType: string;
  sizeBytes: number;
  sha256: string;
  /** ISO 8601 timestamp. */
  uploadedAt: string;
}

/** Metadata sent to the admin UI; never includes the content or storage id. */
export function toManagedFileSummary(file: ManagedFile): ManagedFileSummary {
  const { fileName, contentType, sizeBytes, sha256, uploadedAt } = file;
  return { fileName, contentType, sizeBytes, sha256, uploadedAt: uploadedAt.toISOString() };
}
