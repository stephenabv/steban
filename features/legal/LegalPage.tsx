import type { ReactNode } from "react";
import { PageShell } from "@/features/shared/PageShell";
import styles from "./LegalPage.module.less";

const monthYear = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long" });

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <PageShell eyebrow="Legal" title={title} width="prose">
      <div className={styles.prose}>
        {children}
        <p className={styles.updated}>Last updated: {monthYear.format(new Date())}.</p>
      </div>
    </PageShell>
  );
}
