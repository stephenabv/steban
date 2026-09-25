import type { Metadata } from "next";
import { getProjectService } from "@/server/services";
import { getAdminBasePath } from "@/lib/adminRoute";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { ProjectsTable } from "@/features/admin/ProjectsTable";
import { toAdminProjectRow } from "@/features/admin/projects/toAdminProjectRow";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import styles from "@/features/admin/AdminPage.module.less";

export const metadata: Metadata = { title: "Projects" };

/** Rows loaded into the client-side table (search/filter/sort run in the browser). */
const PAGE_LIMIT = 100;

export default async function AdminProjectsPage() {
  const basePath = getAdminBasePath();
  const result = await getProjectService().getAll({ pageSize: PAGE_LIMIT });
  const projects = result.ok ? result.value.items.map(toAdminProjectRow) : [];
  const total = result.ok ? result.value.total : 0;

  return (
    <div className={styles.page}>
      <AdminPageHeader
        title="Projects"
        description="Create, edit and remove the projects shown on your portfolio."
        actions={
          <Button href={`${basePath}/projects/new`} icon="plus">
            New project
          </Button>
        }
      />

      {result.ok && total > projects.length && (
        <Alert tone="info" title={`Showing the ${projects.length} most recent of ${total} projects`}>
          Older projects aren&apos;t listed here yet; they remain published on the site.
        </Alert>
      )}

      {result.ok ? (
        <ProjectsTable projects={projects} newHref={`${basePath}/projects/new`} />
      ) : (
        <Alert tone="danger" title="Failed to load projects">
          {result.error.message}
        </Alert>
      )}
    </div>
  );
}
