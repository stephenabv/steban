import type { ReactNode } from "react";
import { Icon } from "@/components/icons/Icon";
import type { IconName } from "@/components/icons/Icon";
import { cn } from "@/lib/cn";
import styles from "./Alert.module.less";

export type AlertTone = "info" | "success" | "warning" | "danger";

const TONE_ICON: Record<AlertTone, IconName> = {
  info: "info",
  success: "check-circle",
  warning: "warning",
  danger: "alert",
};

export interface AlertProps {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/**
 * Inline, persistent feedback. `danger` alerts are announced immediately
 * (role="alert"); other tones use a polite live region.
 */
export function Alert({ tone = "info", title, children, action, className }: AlertProps) {
  return (
    <div
      className={cn(styles.alert, styles[tone], className)}
      role={tone === "danger" ? "alert" : "status"}
    >
      <Icon name={TONE_ICON[tone]} size={18} />
      <div className={styles.body}>
        {title && <p className={styles.title}>{title}</p>}
        {children}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
