import type { LegalDocumentKind, LegalDocumentVersion, LegalDraftContent } from "@/server/domain/entities";

/**
 * Versioned storage for legal documents.
 *
 * Every state-changing method is a conditional write: it succeeds only while
 * the version is in a status that allows the action (per
 * LegalVersionLifecycle) and returns null/false otherwise, so two admins
 * acting at once can't, for example, edit a version that was just published.
 * `publish` must be atomic — the previous published version of the same kind
 * is unpublished in the same step, so the public page never has zero or two.
 */
export abstract class LegalDocumentRepository {
  /** All versions of a kind, newest version first. */
  abstract listByKind(kind: LegalDocumentKind): Promise<LegalDocumentVersion[]>;
  abstract findById(id: string): Promise<LegalDocumentVersion | null>;
  abstract findPublished(kind: LegalDocumentKind): Promise<LegalDocumentVersion | null>;
  /** Creates a draft with the next version number for its kind. */
  abstract createDraft(kind: LegalDocumentKind, content: LegalDraftContent): Promise<LegalDocumentVersion>;
  abstract updateDraft(id: string, content: LegalDraftContent): Promise<LegalDocumentVersion | null>;
  abstract publish(id: string): Promise<LegalDocumentVersion | null>;
  abstract unpublish(id: string): Promise<LegalDocumentVersion | null>;
  abstract delete(id: string): Promise<boolean>;
}
