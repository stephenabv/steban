import type { CreateManagedFileInput, ManagedFile, ManagedFileContent } from "@/server/domain/entities";

/**
 * Storage contract for a single-slot uploaded file (resume, profile photo).
 *
 * `replaceActive` must be atomic: the new file becomes active only once it is
 * fully stored, and on failure the previous file stays active and intact.
 */
export abstract class ManagedFileRepository {
  abstract findActive(): Promise<ManagedFile | null>;
  abstract findActiveContent(): Promise<ManagedFileContent | null>;
  abstract replaceActive(input: CreateManagedFileInput): Promise<ManagedFile>;
  /** Removes the active file (and any stored versions). Returns false if there was none. */
  abstract clearActive(): Promise<boolean>;
}
