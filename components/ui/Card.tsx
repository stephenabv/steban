import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./Card.module.less";

type Padding = "none" | "sm" | "md" | "lg";

const PADDING: Record<Padding, string> = {
  none: styles.padNone,
  sm: styles.padSm,
  md: styles.padMd,
  lg: styles.padLg,
};

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  padding?: Padding;
  /** Adds hover elevation — use only when the whole card is actionable. */
  interactive?: boolean;
}

export function Card({ as: Tag = "div", padding = "md", interactive = false, className, ...rest }: CardProps) {
  return (
    <Tag className={cn(interactive ? styles.interactive : styles.card, PADDING[padding], className)} {...rest} />
  );
}

export interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Heading level for document outline correctness. */
  as?: "h2" | "h3";
  id?: string;
}

export function CardHeader({ title, description, actions, as: Heading = "h2", id }: CardHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.headerText}>
        <Heading className={styles.title} id={id}>
          {title}
        </Heading>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
