import type { ResumeFile, ResumeFileContent } from "@/server/domain/entities";
import type { Result } from "@/server/domain/types";
import { ok, err } from "@/server/domain/types";
import type { ResumeRepository } from "@/server/repositories";
import { RESUME_POLICY, ResumeFilePolicy } from "@/server/security/resumeFilePolicy";

/** Thrown for uploads rejected by policy — safe to show to the admin. */
export class ResumeValidationError extends Error {}

export class ResumeService {
  constructor(private readonly repo: ResumeRepository) {}

  async getActive(): Promise<Result<ResumeFile | null>> {
    try {
      return ok(await this.repo.findActive());
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async getActiveContent(): Promise<Result<ResumeFileContent | null>> {
    try {
      return ok(await this.repo.findActiveContent());
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Validates first; only a valid file reaches storage, and storage swaps the
   * active resume atomically — an invalid or failed upload never replaces the
   * current one.
   */
  async upload(fileName: string, content: Buffer): Promise<Result<ResumeFile>> {
    const validation = ResumeFilePolicy.validate(fileName, content);
    if (!validation.ok) return err(new ResumeValidationError(validation.error));
    try {
      return ok(
        await this.repo.replaceActive({
          fileName: validation.fileName,
          contentType: RESUME_POLICY.contentType,
          content,
          sha256: validation.sha256,
        })
      );
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }
}
