import type { Metadata } from "next";
import { getResumeService } from "@/server/services";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { ResumeManager } from "@/features/admin/files/ResumeManager";
import { toManagedFileSummary } from "@/lib/files/ManagedFileSummary";
import { Alert } from "@/components/ui/Alert";
import styles from "@/features/admin/AdminPage.module.less";

export const metadata: Metadata = { title: "Resume" };

export const dynamic = "force-dynamic";

export default async function AdminResumePage() {
  const result = await getResumeService().getActive();
  const resume = result.ok ? result.value : null;

  return (
    <div className={`${styles.page} ${styles.narrow}`}>
      <AdminPageHeader
        title="Resume"
        description="Upload the PDF visitors get from the Resume button. Replacing it takes effect immediately — no links to update."
      />
      {result.ok ? (
        <ResumeManager resume={resume && toManagedFileSummary(resume)} />
      ) : (
        <Alert tone="danger" title="Couldn't load the current resume">
          Please refresh the page. If this keeps happening, check the database connection.
        </Alert>
      )}
    </div>
  );
}
