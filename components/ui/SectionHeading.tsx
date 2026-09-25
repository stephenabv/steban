import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./SectionHeading.module.less";

export interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  /** `page` renders an h1 at hero scale; `section` renders an h2. */
  variant?: "page" | "section";
  align?: "start" | "center";
  /** Rendered beside the heading on wide screens (e.g. "View all"). */
  actions?: ReactNode;
  id?: string;
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  variant = "section",
  align = "start",
  actions,
  id,
  className,
}: SectionHeadingProps) {
  const Heading = variant === "page" ? "h1" : "h2";

  const heading = (
    <div className={cn(styles.heading, styles[variant], align === "center" && styles.center, !actions && className)}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <Heading id={id} className={styles.title}>
        {title}
      </Heading>
      {description && <p className={styles.description}>{description}</p>}
    </div>
  );

  if (!actions) return heading;

  return (
    <div className={cn(styles.row, className)}>
      {heading}
      {actions}
    </div>
  );
}

/** Gradient emphasis for a word or phrase inside a heading. */
export function Highlight({ children }: { children: ReactNode }) {
  return <span className={styles.highlight}>{children}</span>;
}
