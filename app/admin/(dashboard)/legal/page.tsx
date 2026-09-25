import type { Metadata } from "next";
import { LEGAL_DOCUMENT_KINDS, isLegalDocumentKind, type LegalDocumentKind } from "@/server/domain/entities";
import { getLegalDocumentService } from "@/server/services";
import { getAdminBasePath } from "@/lib/adminRoute";
import { LegalDocumentsManager } from "@/features/admin/legal/LegalDocumentsManager";
import { toLegalVersionSummary, type LegalVersionSummary } from "@/features/admin/legal/LegalVersionDto";
import { LoadError } from "@/features/admin/content/LoadError";

export const metadata: Metadata = { title: "Legal pages" };
export const dynamic = "force-dynamic";

export default async function AdminLegalPage({ searchParams }: { searchParams: Promise<{ doc?: string }> }) {
  const { doc } = await searchParams;
  const kind: LegalDocumentKind = doc && isLegalDocumentKind(doc) ? doc : "privacy";
  const service = getLegalDocumentService();

  const [versions, ...published] = await Promise.all([
    service.list(kind),
    ...LEGAL_DOCUMENT_KINDS.map((k) => service.getPublished(k)),
  ]);
  if (!versions.ok || published.some((r) => !r.ok)) return <LoadError title="Legal pages" />;

  const liveByKind = Object.fromEntries(
    LEGAL_DOCUMENT_KINDS.map((k, i) => {
      const result = published[i];
      return [k, result.ok && result.value ? toLegalVersionSummary(result.value) : null];
    })
  ) as Record<LegalDocumentKind, LegalVersionSummary | null>;

  return (
    <LegalDocumentsManager
      basePath={getAdminBasePath()}
      kind={kind}
      versions={versions.value.map(toLegalVersionSummary)}
      liveByKind={liveByKind}
    />
  );
}
