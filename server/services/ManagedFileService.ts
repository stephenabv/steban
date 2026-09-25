import type { ManagedFile, ManagedFileContent } from "@/server/domain/entities";
import type { Result } from "@/server/domain/types";
import { ok, err } from "@/server/domain/types";
import type { ManagedFileRepository } from "@/server/repositories";
import type { FilePolicy } from "@/server/security/files";

/** Thrown for uploads rejected by policy — safe to show to the admin. */
export class FileValidationError extends Error {}

function toError(e: unknown): Error {
  return e instanceof Error ? e : new Error(String(e));
}

/**
 * Business rules for a single-slot uploaded file. Storage and validation are
 * injected, so each concrete file (resume, profile photo) only binds its policy.
 */
export abstract class ManagedFileService {
  protected constructor(
    protected readonly repo: ManagedFileRepository,
    readonly policy: FilePolicy
  ) {}

  async getActive(): Promise<Result<ManagedFile | null>> {
    try {
      return ok(await this.repo.findActive());
    } catch (e) {
      return err(toError(e));
    }
  }

  async getActiveContent(): Promise<Result<ManagedFileContent | null>> {
    try {
      return ok(await this.repo.findActiveContent());
    } catch (e) {
      return err(toError(e));
    }
  }

  /**
   * Validates first; only a valid file reaches storage, and storage swaps the
   * active file atomically — an invalid or failed upload never replaces the
   * current one.
   */
  async upload(fileName: string, content: Buffer): Promise<Result<ManagedFile>> {
    const validation = this.policy.validate(fileName, content);
    if (!validation.ok) return err(new FileValidationError(validation.error));
    try {
      return ok(
        await this.repo.replaceActive({
          fileName: validation.fileName,
          contentType: validation.contentType,
          content,
          sha256: validation.sha256,
        })
      );
    } catch (e) {
      return err(toError(e));
    }
  }

  /** Removes the active file. Resolves to false when there was nothing to remove. */
  async remove(): Promise<Result<boolean>> {
    try {
      return ok(await this.repo.clearActive());
    } catch (e) {
      return err(toError(e));
    }
  }
}
