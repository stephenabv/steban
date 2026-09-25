import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLegalDocumentService } from "@/server/services";
import { legalVersionIdSchema } from "@/server/security/contentSchemas";
import { getAdminBasePath } from "@/lib/adminRoute";
import { LegalVersionEditor } from "@/features/admin/legal/LegalVersionEditor";
import { toLegalVersionDetail, toLegalVersionSummary } from "@/features/admin/legal/LegalVersionDto";
import { LoadError } from "@/features/admin/content/LoadError";

export const metadata: Metadata = { title: "Legal version" };
export const dynamic = "force-dynamic";

export default async function AdminLegalVersionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!legalVersionIdSchema.safeParse(id).success) notFound();

  const service = getLegalDocumentService();
  const result = await service.get(id);
  if (!result.ok) return <LoadError title="Legal version" />;
  if (!result.value) notFound();
  const version = result.value;

  const live = await service.getPublished(version.kind);
  if (!live.ok) return <LoadError title="Legal version" />;

  return (
    <LegalVersionEditor
      // Remount when navigating between versions so form state never leaks across them.
      key={version.id}
      basePath={getAdminBasePath()}
      version={toLegalVersionDetail(version)}
      live={live.value && toLegalVersionSummary(live.value)}
    />
  );
}
