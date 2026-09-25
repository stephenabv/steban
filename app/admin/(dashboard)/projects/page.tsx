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

export default async function AdminProjectsPage() {
  const basePath = getAdminBasePath();
  const result = await getProjectService().getAll({ pageSize: 100 });
  const projects = result.ok ? result.value.items.map(toAdminProjectRow) : [];

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
