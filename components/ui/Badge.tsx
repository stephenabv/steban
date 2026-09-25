import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import styles from "./Badge.module.less";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Shows a leading status dot. */
  dot?: boolean;
  /** Animates the status dot (e.g. "available"). Respects reduced motion. */
  pulse?: boolean;
}

export function Badge({ tone = "neutral", dot = false, pulse = false, className, children, ...rest }: BadgeProps) {
  return (
    <span className={cn(styles.badge, styles[tone], pulse && styles.pulse, className)} {...rest}>
      {(dot || pulse) && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  );
}
