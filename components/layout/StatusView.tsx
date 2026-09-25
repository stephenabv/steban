import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./StatusView.module.less";

export interface StatusViewProps {
  code?: string;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
  /** Fill the viewport (root-level pages without a navbar). */
  fullScreen?: boolean;
  /** Heading level — h1 for route-level pages, h2 inside an existing page. */
  as?: "h1" | "h2";
}

/** Shared presentation for 404, error and unavailable states. */
export function StatusView({ code, title, description, actions, fullScreen = false, as: Heading = "h1" }: StatusViewProps) {
  return (
    <section className={cn(styles.wrap, fullScreen && styles.fullScreen)}>
      <div className={styles.glow} aria-hidden="true" />
      {code && (
        <p className={styles.code} aria-hidden="true">
          {code}
        </p>
      )}
      <Heading className={styles.title}>{title}</Heading>
      <p className={styles.description}>{description}</p>
      {actions && <div className={styles.actions}>{actions}</div>}
    </section>
  );
}
