import type {
  LegalDocumentKind,
  LegalDocumentVersion,
  LegalDraftContent,
} from "@/server/domain/entities";
import type { Result } from "@/server/domain/types";
import { ok, err } from "@/server/domain/types";
import { LegalVersionLifecycle, type LegalVersionAction } from "@/server/domain/legal/LegalVersionLifecycle";
import type { LegalDocumentRepository } from "@/server/repositories";

/** A rule violation that is safe to show to the admin (e.g. editing a published version). */
export class LegalDocumentError extends Error {}

/** Where a new draft's initial content comes from. */
export type LegalDraftSource =
  | { from: "default" }
  | { from: "version"; versionId: string };

type Defaults = Record<LegalDocumentKind, Pick<LegalDraftContent, "title" | "body">>;

function toError(e: unknown): Error {
  return e instanceof Error ? e : new Error(String(e));
}

/**
 * Draft → publish workflow for legal pages. Lifecycle rules live in
 * LegalVersionLifecycle; storage enforces them atomically.
 */
export class LegalDocumentService {
  constructor(
    private readonly repo: LegalDocumentRepository,
    private readonly defaults: Defaults
  ) {}

  async list(kind: LegalDocumentKind): Promise<Result<LegalDocumentVersion[]>> {
    return this.attempt(() => this.repo.listByKind(kind));
  }

  async get(id: string): Promise<Result<LegalDocumentVersion | null>> {
    return this.attempt(() => this.repo.findById(id));
  }

  async getPublished(kind: LegalDocumentKind): Promise<Result<LegalDocumentVersion | null>> {
    return this.attempt(() => this.repo.findPublished(kind));
  }

  async createDraft(kind: LegalDocumentKind, source: LegalDraftSource): Promise<Result<LegalDocumentVersion>> {
    try {
      let content: LegalDraftContent;
      if (source.from === "version") {
        const base = await this.repo.findById(source.versionId);
        if (!base || base.kind !== kind) return err(new LegalDocumentError("The version to copy no longer exists."));
        content = { title: base.title, body: base.body, changeNote: `Based on version ${base.versionNumber}.` };
      } else {
        content = { ...this.defaults[kind], changeNote: "Started from the built-in wording." };
      }
      return ok(await this.repo.createDraft(kind, content));
    } catch (e) {
      return err(toError(e));
    }
  }

  saveDraft(id: string, content: LegalDraftContent): Promise<Result<LegalDocumentVersion>> {
    return this.transition(id, "edit", () => this.repo.updateDraft(id, content));
  }

  publish(id: string): Promise<Result<LegalDocumentVersion>> {
    return this.transition(id, "publish", () => this.repo.publish(id));
  }

  unpublish(id: string): Promise<Result<LegalDocumentVersion>> {
    return this.transition(id, "unpublish", () => this.repo.unpublish(id));
  }

  async delete(id: string): Promise<Result<LegalDocumentVersion>> {
    // Read first so callers learn which document changed.
    const existing = await this.get(id);
    if (!existing.ok) return existing;
    if (!existing.value) return err(new LegalDocumentError("This version no longer exists."));
    const version = existing.value;
    return this.transition(id, "delete", async () => ((await this.repo.delete(id)) ? version : null));
  }

  /**
   * Runs a conditional write. When it doesn't apply, re-reads the version to
   * explain why (gone, or in a status that forbids the action).
   */
  private async transition(
    id: string,
    action: LegalVersionAction,
    write: () => Promise<LegalDocumentVersion | null>
  ): Promise<Result<LegalDocumentVersion>> {
    try {
      const updated = await write();
      if (updated) return ok(updated);
      const current = await this.repo.findById(id);
      return err(
        new LegalDocumentError(current ? LegalVersionLifecycle.reason(action) : "This version no longer exists.")
      );
    } catch (e) {
      return err(toError(e));
    }
  }

  private async attempt<T>(read: () => Promise<T>): Promise<Result<T>> {
    try {
      return ok(await read());
    } catch (e) {
      return err(toError(e));
    }
  }
}
