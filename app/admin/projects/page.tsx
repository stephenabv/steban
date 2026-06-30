import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/features/admin/AdminPage.module.less";

export const metadata: Metadata = { title: "Projects" };

// TODO: fetch from ProjectService when DB is wired up
const projects: { id: string; title: string; slug: string; featured: boolean; publishedAt: Date }[] = [];

export default function AdminProjectsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Projects</h1>
        <p className={styles.subtitle}>Manage all portfolio projects.</p>
      </div>

      <div className={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 className={styles.cardTitle} style={{ margin: 0, borderBottom: "none", paddingBottom: 0 }}>All Projects</h2>
          <Link href="/admin/projects/new" className={styles.btnSave} style={{ textDecoration: "none" }}>
            + New Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <p style={{ color: "var(--color-text-muted, #606075)", textAlign: "center", padding: "3rem" }}>
            No projects yet. Click &ldquo;New Project&rdquo; to add your first one.
          </p>
        ) : (
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
                    <div className={styles.tableActions}>
                      <Link href={`/admin/projects/${p.id}`} className={styles.tableActionBtn}>
                        Edit
                      </Link>
                      <button className={`${styles.tableActionBtn} ${styles.danger}`} type="button">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
