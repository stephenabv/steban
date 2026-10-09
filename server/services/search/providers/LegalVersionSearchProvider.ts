import { LEGAL_DOCUMENTS } from "@/config/legal";
import type { SearchField } from "@/lib/search/SearchQuery";
import {
  LEGAL_DOCUMENT_KINDS,
  type LegalDocumentVersion,
  type LegalVersionStatus,
} from "@/server/domain/entities";
import type { LegalDocumentService } from "../../LegalDocumentService";
import { AdminSearchProvider, type ProviderHit } from "../AdminSearchProvider";

const STATUS_LABELS: Record<LegalVersionStatus, string> = {
  draft: "Draft",
  published: "Live",
  unpublished: "Unpublished",
};

export class LegalVersionSearchProvider extends AdminSearchProvider<LegalDocumentVersion> {
  readonly group = "legal" as const;
  readonly label = "Legal pages";

  constructor(private readonly legal: LegalDocumentService) {
    super();
  }

  protected async load(): Promise<readonly LegalDocumentVersion[]> {
    const lists = await Promise.all(LEGAL_DOCUMENT_KINDS.map((kind) => this.legal.list(kind)));
    return lists.flatMap((result) => this.unwrap(result));
  }

  protected fields(v: LegalDocumentVersion): SearchField[] {
    return [
      { text: LEGAL_DOCUMENTS[v.kind].label, weight: 3 },
      { text: v.title, weight: 3 },
      { text: `v${v.versionNumber} version ${v.versionNumber}`, weight: 2 },
      { text: v.changeNote, weight: 1 },
    ];
  }

  protected toHit(v: LegalDocumentVersion): ProviderHit {
    return {
      id: v.id,
      title: `${LEGAL_DOCUMENTS[v.kind].label} · v${v.versionNumber}`,
      subtitle: v.changeNote || v.title,
      badge: STATUS_LABELS[v.status],
      path: `/legal/${encodeURIComponent(v.id)}`,
    };
  }

  protected recency(v: LegalDocumentVersion): number {
    return v.updatedAt.getTime();
  }
}
