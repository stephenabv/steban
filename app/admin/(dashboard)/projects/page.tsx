import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/features/admin/AdminPage.module.less";
import { ProjectRowActions } from "@/features/admin/ProjectRowActions";
import { BackButton } from "@/features/admin/BackButton";
import { getProjectService } from "@/server/services";
import { getAdminBasePath } from "@/lib/adminRoute";

export const metadata: Metadata = { title: "Projects" };

export default async function AdminProjectsPage() {
  const basePath = getAdminBasePath();
  const result = await getProjectService().getAll({ pageSize: 100 });
  const projects = result.ok ? result.value.items : [];

  return (
    <div className={styles.page}>
      <BackButton />
      <div className={styles.header}>
        <h1 className={styles.title}>Projects</h1>
        <p className={styles.subtitle}>Manage all portfolio projects.</p>
      </div>

      {!result.ok && (
        <div className={styles.errorBanner} role="alert">
          Failed to load projects: {result.error.message}
        </div>
      )}

      <div className={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 className={styles.cardTitle} style={{ margin: 0, borderBottom: "none", paddingBottom: 0 }}>All Projects</h2>
          <Link href={`${basePath}/projects/new`} className={styles.btnSave} style={{ textDecoration: "none" }}>
            + New Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <p style={{ color: "var(--color-text-muted, #606075)", textAlign: "center", padding: "3rem" }}>
            No projects yet. Click &ldquo;New Project&rdquo; to add your first one.
          </p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Title</th>
                  <th className={styles.th}>Slug</th>
                  <th className={styles.th}>Featured</th>
                  <th className={styles.th}>Published</th>
                  <th className={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td className={styles.td}>{p.title}</td>
                    <td className={styles.td}>{p.slug}</td>
                    <td className={styles.td}>
                      <span className={`${styles.tableBadge} ${p.featured ? styles.active : styles.inactive}`}>
                        {p.featured ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className={styles.td}>
                      {new Date(p.publishedAt).toLocaleDateString()}
                    </td>
                    <td className={styles.td}>
                      <ProjectRowActions
                        project={{
                          id: p.id,
                          slug: p.slug,
                          title: p.title,
                          summary: p.summary,
                          description: p.description,
                          coverImage: p.coverImage,
                          technologies: p.technologies,
                          features: p.features,
                          githubUrl: p.githubUrl,
                          liveUrl: p.liveUrl,
                          featured: p.featured,
                          publishedAt: p.publishedAt.toISOString(),
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
