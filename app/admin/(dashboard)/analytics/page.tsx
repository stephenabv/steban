import type { Metadata } from "next";
import { analyticsConfig } from "@/config/analytics";
import styles from "@/features/admin/AdminPage.module.less";

export const metadata: Metadata = { title: "Analytics" };

export default function AdminAnalyticsPage() {
  const { measurementId, enabled } = analyticsConfig.firebase;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Analytics</h1>
        <p className={styles.subtitle}>Firebase Analytics integration status and configuration.</p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Firebase Analytics (GA4)</h2>
        <div className={styles.form}>
          <div className={styles.field}>
            <p className={styles.label}>Measurement ID</p>
            <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", color: "#6366f1" }}>
              {measurementId}
            </code>
          </div>
          <div className={styles.field}>
            <p className={styles.label}>Status</p>
            <span className={`${styles.tableBadge} ${enabled ? styles.active : styles.inactive}`}>
              {enabled ? "Active (production)" : "Inactive (dev mode)"}
            </span>
          </div>
          <div className={styles.field}>
            <p className={styles.label}>Provider</p>
            <p className={styles.hint}>
              Analytics is powered by the Firebase SDK (firebase/analytics) using project{" "}
              <code>steban-5889b</code>. Page view events are tracked automatically on each
              client-side navigation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
