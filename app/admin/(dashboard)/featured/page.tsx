import type { Metadata } from "next";
import styles from "@/features/admin/AdminPage.module.less";

export const metadata: Metadata = { title: "Featured Projects" };

// TODO: fetch from ProjectService when DB is wired up
const allProjects: { id: string; title: string; featured: boolean; featuredOrder?: number }[] = [];

export default function AdminFeaturedPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Featured Projects</h1>
        <p className={styles.subtitle}>Choose which projects appear in the homepage carousel (max 5). Drag to reorder.</p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Project Selection</h2>

        {allProjects.length === 0 ? (
          <p style={{ color: "var(--color-text-muted, #606075)", textAlign: "center", padding: "3rem" }}>
            No projects yet. Add projects first, then return here to feature them.
          </p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Project</th>
                <th className={styles.th}>Featured</th>
                <th className={styles.th}>Order</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allProjects.map((p) => (
                <tr key={p.id}>
                  <td className={styles.td}>{p.title}</td>
                  <td className={styles.td}>
                    <span className={`${styles.tableBadge} ${p.featured ? styles.active : styles.inactive}`}>
                      {p.featured ? "Featured" : "Not featured"}
                    </span>
                  </td>
                  <td className={styles.td}>{p.featuredOrder ?? "—"}</td>
                  <td className={styles.td}>
                    <button className={styles.tableActionBtn} type="button">
                      {p.featured ? "Unfeature" : "Feature"}
                    </button>
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
