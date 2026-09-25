/** Legal pages whose wording is managed in the admin. */
export const LEGAL_DOCUMENT_KINDS = ["privacy", "terms"] as const;
export type LegalDocumentKind = (typeof LEGAL_DOCUMENT_KINDS)[number];

/**
 * - `draft`: being written; editable, never shown publicly.
 * - `published`: the one version the public page shows (at most one per kind).
 * - `unpublished`: previously published, now withdrawn; kept read-only as a record.
 */
export const LEGAL_VERSION_STATUSES = ["draft", "published", "unpublished"] as const;
export type LegalVersionStatus = (typeof LEGAL_VERSION_STATUSES)[number];

export interface LegalDocumentVersion {
  id: string;
  kind: LegalDocumentKind;
  /** Sequential per kind, starting at 1; never reused. */
  versionNumber: number;
  title: string;
  /** Lightweight Markdown (see lib/markup/LegalMarkup.ts). */
  body: string;
  /** Internal note describing what changed; not shown publicly. */
  changeNote: string;
  status: LegalVersionStatus;
  createdAt: Date;
  updatedAt: Date;
  /** When this version most recently went live. */
  publishedAt: Date | null;
  unpublishedAt: Date | null;
}

/** Editable fields of a draft. */
export interface LegalDraftContent {
  title: string;
  body: string;
  changeNote: string;
}

export function isLegalDocumentKind(value: string): value is LegalDocumentKind {
  return (LEGAL_DOCUMENT_KINDS as readonly string[]).includes(value);
}
