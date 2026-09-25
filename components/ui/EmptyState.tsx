import type { ReactNode } from "react";
import { Icon } from "@/components/icons/Icon";
import type { IconName } from "@/components/icons/Icon";
import { cn } from "@/lib/cn";
import styles from "./EmptyState.module.less";

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}

export function EmptyState({ icon = "inbox", title, description, action, compact = false, className }: EmptyStateProps) {
  return (
    <div className={cn(styles.empty, compact && styles.compact, className)}>
      <span className={styles.icon}>
        <Icon name={icon} size={22} />
      </span>
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
