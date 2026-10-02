import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminBasePath } from "@/lib/adminRoute";
import { requireAdmin } from "@/server/security/adminGuard";
import { getCoverLetterService } from "@/server/services/coverLetter/coverLetterService.instance";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { CoverLetterList } from "@/features/admin/coverLetters/CoverLetterList";
import { toListItem } from "@/features/admin/coverLetters/CoverLetterDto";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import styles from "@/features/admin/AdminPage.module.less";

export const metadata: Metadata = { title: "Cover Letters" };

// Private, per-owner data: never cached or prerendered.
export const dynamic = "force-dynamic";

export default async function AdminCoverLettersPage() {
  const basePath = getAdminBasePath();
  const admin = await requireAdmin();
  if (!admin) redirect(`${basePath}/login`);

  const result = await getCoverLetterService().list(admin.ownerId);

  return (
    <div className={styles.page}>
      <AdminPageHeader
        title="Cover Letters"
        description="Letters written from your portfolio for each job you apply to."
        actions={
          <Button href={`${basePath}/cover-letters/new`} icon="plus">
            New cover letter
          </Button>
        }
      />
      {result.ok ? (
        <CoverLetterList letters={result.value.map(toListItem)} basePath={basePath} />
      ) : (
        <Alert tone="danger" title="Couldn't load your cover letters">
          Please refresh the page to try again.
        </Alert>
      )}
    </div>
  );
}
