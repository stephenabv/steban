import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import type { IconName } from "@/components/icons/Icon";
import { cn } from "@/lib/cn";
import styles from "./AdminPage.module.less";

export interface StatCardProps {
  label: string;
  value: number | string;
  icon: IconName;
  href?: string;
  hint?: string;
  tone?: "default" | "accent" | "warning";
}

export function StatCard({ label, value, icon, href, hint, tone = "default" }: StatCardProps) {
  const body = (
    <>
      <div className={styles.statTop}>
        <p className={styles.statLabel}>{label}</p>
        <span className={cn(styles.statIcon, styles[`tone-${tone}`])} aria-hidden="true">
          <Icon name={icon} size={16} />
        </span>
      </div>
      <p className={styles.statValue}>{value}</p>
      {hint && <p className={styles.statHint}>{hint}</p>}
    </>
  );

  return href ? (
    <Link href={href} className={cn(styles.statCard, styles.statLink)}>
      {body}
    </Link>
  ) : (
    <div className={styles.statCard}>{body}</div>
  );
}
