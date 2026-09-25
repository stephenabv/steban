import type { CreateResumeFileInput, ResumeFile, ResumeFileContent } from "@/server/domain/entities";

/**
 * Storage contract for the single active resume.
 *
 * `replaceActive` must be atomic: the new file becomes active only once it is
 * fully stored, and on failure the previous resume stays active and intact.
 */
export abstract class ResumeRepository {
  abstract findActive(): Promise<ResumeFile | null>;
  abstract findActiveContent(): Promise<ResumeFileContent | null>;
  abstract replaceActive(input: CreateResumeFileInput): Promise<ResumeFile>;
}
