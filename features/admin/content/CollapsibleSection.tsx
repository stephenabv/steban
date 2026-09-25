"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/icons/Icon";
import { cn } from "@/lib/cn";
import styles from "./CollapsibleSection.module.less";

interface Props {
  id: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  /** Short status shown beside the title, e.g. "4 entries". */
  summary?: string;
  /** Flags the header when a field inside has a validation error. */
  hasErrors?: boolean;
  children: ReactNode;
}

/**
 * Editor section with a disclosure header. Collapsed content stays mounted
 * (just hidden), so nothing typed is lost and the form still submits it.
 */
export function CollapsibleSection({ id, title, open, onToggle, summary, hasErrors = false, children }: Props) {
  const panelId = `${id}-panel`;
  return (
    <section className={styles.section} aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`} className={styles.heading}>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span className={styles.title}>{title}</span>
          {summary && <span className={styles.summary}>{summary}</span>}
          {hasErrors && (
            <Badge tone="danger" dot className={styles.errorBadge}>
              Needs attention
            </Badge>
          )}
          <Icon name="chevron-down" size={18} className={cn(styles.chevron, open && styles.chevronOpen)} />
        </button>
      </h2>
      <div id={panelId} className={styles.panel} hidden={!open}>
        {children}
      </div>
    </section>
  );
}
