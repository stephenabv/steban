import type {
  LegalDocumentKind,
  LegalDocumentVersion,
  LegalVersionStatus,
} from "@/server/domain/entities";

/** Serialisable version metadata passed from Server Components to the admin UI. */
export interface LegalVersionSummary {
  id: string;
  kind: LegalDocumentKind;
  versionNumber: number;
  title: string;
  changeNote: string;
  status: LegalVersionStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  unpublishedAt: string | null;
}

export interface LegalVersionDetail extends LegalVersionSummary {
  body: string;
}

export function toLegalVersionSummary(v: LegalDocumentVersion): LegalVersionSummary {
  return {
    id: v.id,
    kind: v.kind,
    versionNumber: v.versionNumber,
    title: v.title,
    changeNote: v.changeNote,
    status: v.status,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
    publishedAt: v.publishedAt?.toISOString() ?? null,
    unpublishedAt: v.unpublishedAt?.toISOString() ?? null,
  };
}

export function toLegalVersionDetail(v: LegalDocumentVersion): LegalVersionDetail {
  return { ...toLegalVersionSummary(v), body: v.body };
}
