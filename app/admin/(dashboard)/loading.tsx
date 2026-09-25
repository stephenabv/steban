import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";
import styles from "@/features/admin/AdminPage.module.less";

/** In-shell skeleton: the sidebar stays interactive while a page loads. */
export default function AdminLoading() {
  return (
    <div className={styles.page} role="status" aria-label="Loading page">
      <div className={styles.headerText}>
        <Skeleton width={220} height={30} />
        <Skeleton width={320} height={14} />
      </div>
      <div className={styles.statsGrid}>
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i}>
            <Skeleton width="50%" height={12} />
            <div style={{ height: 14 }} />
            <Skeleton width="40%" height={32} />
          </Card>
        ))}
      </div>
      <Card>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0" }}>
            <Skeleton width={48} height={36} />
            <div style={{ flex: 1, display: "grid", gap: 8 }}>
              <Skeleton width="45%" height={12} />
              <Skeleton width="25%" height={10} />
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
