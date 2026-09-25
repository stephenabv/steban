import type { ManagedFile, ManagedFileContent } from "@/server/domain/entities";
import type { Result } from "@/server/domain/types";
import { ok, err } from "@/server/domain/types";
import type { ManagedFileRepository } from "@/server/repositories";
import type { FilePolicy } from "@/server/security/files";

/** A rule violation whose message is safe to show to the admin. */
export class ManagedFileError extends Error {}

/** An upload rejected by policy. */
export class FileValidationError extends ManagedFileError {}

/** An action that needs a file when none is uploaded. */
export class ManagedFileMissingError extends ManagedFileError {}

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

  /** The active file only if it is published — what the public site may use. */
  async getPublished(): Promise<Result<ManagedFile | null>> {
    const result = await this.getActive();
    return result.ok && result.value && !result.value.published ? ok(null) : result;
  }

  async setPublished(published: boolean): Promise<Result<ManagedFile>> {
    try {
      const file = await this.repo.setPublished(published);
      return file ? ok(file) : err(new ManagedFileMissingError("There is no uploaded file to change."));
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
