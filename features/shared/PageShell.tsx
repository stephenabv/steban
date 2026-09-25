import type { ReactNode } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";
import styles from "./PageShell.module.less";

export interface PageShellProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** Narrow reading width for text-heavy pages. */
  width?: "default" | "prose";
  className?: string;
}

/** Standard public page frame: navbar offset, page heading, and content container. */
export function PageShell({ eyebrow, title, description, children, width = "default", className }: PageShellProps) {
  return (
    <div className={cn(styles.page, width === "prose" && styles.prose, className)}>
      <header className={styles.header}>
        <div className={styles.glow} aria-hidden="true" />
        <SectionHeading variant="page" eyebrow={eyebrow} title={title} description={description} />
      </header>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
