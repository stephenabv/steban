import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAdminBasePath } from "@/lib/adminRoute";
import { requireAdmin } from "@/server/security/adminGuard";
import { coverLetterIdSchema } from "@/server/security/coverLetterSchemas";
import { CoverLetterNotFoundError } from "@/server/domain/coverLetter";
import { getCoverLetterService } from "@/server/services/coverLetter/coverLetterService.instance";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { CoverLetterEditor } from "@/features/admin/coverLetters/CoverLetterEditor";
import { toCoverLetterView } from "@/features/admin/coverLetters/CoverLetterDto";
import styles from "@/features/admin/AdminPage.module.less";

// Generic title: company names stay out of the browser history and tab titles.
export const metadata: Metadata = { title: "Cover Letter" };

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminCoverLetterPage({ params }: PageProps) {
  const basePath = getAdminBasePath();
  const admin = await requireAdmin();
  if (!admin) redirect(`${basePath}/login`);

  const id = coverLetterIdSchema.safeParse((await params).id);
  if (!id.success) notFound();

  const service = getCoverLetterService();
  const result = await service.get(admin.ownerId, id.data);
  if (!result.ok) {
    if (result.error instanceof CoverLetterNotFoundError) notFound();
    throw new Error("Failed to load the cover letter.");
  }
  const letter = toCoverLetterView(result.value);

  return (
    <div className={styles.page}>
      <AdminPageHeader
        title={letter.application.companyName}
        description={letter.application.positionTitle}
        back={{ href: `${basePath}/cover-letters`, label: "Cover Letters" }}
      />
      <CoverLetterEditor
        initial={letter}
        strategies={service.availableStrategies()}
        basePath={basePath}
      />
    </div>
  );
}
