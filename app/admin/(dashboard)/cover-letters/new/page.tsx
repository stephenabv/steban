import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminBasePath } from "@/lib/adminRoute";
import { requireAdmin } from "@/server/security/adminGuard";
import type { AdminPrincipal } from "@/server/security/adminGuard";
import { coverLetterIdSchema } from "@/server/security/coverLetterSchemas";
import type { CoverLetterService } from "@/server/services/coverLetter/CoverLetterService";
import { getCoverLetterService } from "@/server/services/coverLetter/coverLetterService.instance";
import { CoverLetterError } from "@/server/domain/coverLetter";
import type { JobApplicationContent } from "@/server/domain/coverLetter";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { NewCoverLetterForm } from "@/features/admin/coverLetters/NewCoverLetterForm";
import { ProfileSummary } from "@/features/admin/coverLetters/ProfileSummary";
import { toFormValues } from "@/features/admin/coverLetters/CoverLetterDto";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import styles from "@/features/admin/AdminPage.module.less";

export const metadata: Metadata = { title: "New Cover Letter" };

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ from?: string | string[] }>;
}

/** "Duplicate for new company": pre-fill from one of the admin's own letters. */
async function prefill(
  service: CoverLetterService,
  admin: AdminPrincipal,
  from: string | string[] | undefined
): Promise<Partial<JobApplicationContent>> {
  const id = coverLetterIdSchema.safeParse(from);
  if (!id.success) return {};
  const result = await service.duplicateForNewCompany(admin.ownerId, id.data);
  return result.ok ? result.value : {};
}

export default async function AdminNewCoverLetterPage({ searchParams }: PageProps) {
  const basePath = getAdminBasePath();
  const admin = await requireAdmin();
  if (!admin) redirect(`${basePath}/login`);

  const service = getCoverLetterService();
  const [profile, source] = await Promise.all([
    service.getProfile(),
    searchParams.then(({ from }) => prefill(service, admin, from)),
  ]);
  const initialValues = toFormValues({ ...source, letterDate: service.today() });

  return (
    <div className={`${styles.page} ${styles.narrow}`}>
      <AdminPageHeader
        title="New cover letter"
        description="Fill in the job. Your own details come from your portfolio."
        back={{ href: `${basePath}/cover-letters`, label: "Cover Letters" }}
      />
      {profile.ok ? (
        <ProfileSummary profile={profile.value} basePath={basePath} />
      ) : (
        <Alert
          tone="warning"
          title="Your profile isn't ready yet"
          action={
            <Button href={`${basePath}/hero`} variant="secondary" size="sm" icon="pencil">
              Edit hero
            </Button>
          }
        >
          {profile.error instanceof CoverLetterError
            ? profile.error.message
            : "Your portfolio details couldn't be loaded. Please refresh the page."}
        </Alert>
      )}
      <NewCoverLetterForm
        basePath={basePath}
        initialValues={initialValues}
        strategies={service.availableStrategies()}
      />
    </div>
  );
}
