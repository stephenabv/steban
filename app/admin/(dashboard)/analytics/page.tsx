import type { Metadata } from "next";
import { analyticsConfig } from "@/config/analytics";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import styles from "@/features/admin/AdminPage.module.less";

export const metadata: Metadata = { title: "Analytics" };

export default function AdminAnalyticsPage() {
  const { measurementId, enabled } = analyticsConfig.firebase;

  return (
    <div className={`${styles.page} ${styles.narrow}`}>
      <AdminPageHeader title="Analytics" description="Firebase Analytics integration status and configuration." />

      <Card padding="lg">
        <CardHeader
          title="Firebase Analytics (GA4)"
          actions={
            <Badge tone={enabled ? "success" : "neutral"} dot>
              {enabled ? "Active (production)" : "Inactive (dev mode)"}
            </Badge>
          }
        />
        <dl className={styles.definitionList}>
          <dt>Measurement ID</dt>
          <dd>
            <code className={styles.mono}>{measurementId}</code>
          </dd>
          <dt>Provider</dt>
          <dd>
            Firebase SDK (<code>firebase/analytics</code>) using project <code>steban-5889b</code>.
          </dd>
          <dt>Tracking</dt>
          <dd>Page views are recorded automatically on each client-side navigation.</dd>
        </dl>
      </Card>
    </div>
  );
}
