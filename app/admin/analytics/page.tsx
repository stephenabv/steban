import type { Metadata } from "next";
import { analyticsConfig } from "@/config/analytics";
import styles from "@/features/admin/AdminPage.module.less";

export const metadata: Metadata = { title: "Analytics" };

export default function AdminAnalyticsPage() {
  const gaId = analyticsConfig.googleAnalytics.measurementId;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Analytics</h1>
        <p className={styles.subtitle}>Google Analytics 4 integration status and configuration.</p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Google Analytics 4</h2>
        <div className={styles.form}>
          <div className={styles.field}>
            <p className={styles.label}>Measurement ID</p>
            <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", color: gaId ? "#6366f1" : "#606075" }}>
              {gaId || "Not configured — set NEXT_PUBLIC_GA_MEASUREMENT_ID in environment variables."}
            </code>
          </div>
          <div className={styles.field}>
            <p className={styles.label}>Status</p>
            <span className={`${styles.tableBadge} ${analyticsConfig.googleAnalytics.enabled ? styles.active : styles.inactive}`}>
              {analyticsConfig.googleAnalytics.enabled ? "Active (production)" : "Inactive (dev mode or not configured)"}
            </span>
          </div>
          <div className={styles.field}>
            <p className={styles.label}>How to configure</p>
            <p className={styles.hint}>
              Set the <code>NEXT_PUBLIC_GA_MEASUREMENT_ID</code> environment variable in your Vercel project settings to your GA4 Measurement ID (e.g.&nbsp;<code>G-XXXXXXXXXX</code>). Analytics fires automatically in production.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
