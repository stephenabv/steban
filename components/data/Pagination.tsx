"use client";

import { Icon } from "@/components/icons/Icon";
import styles from "./Pagination.module.less";

export interface PaginationProps {
  page: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
  total: number;
  noun?: string;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, rangeStart, rangeEnd, total, noun = "items", onPageChange }: PaginationProps) {
  if (total === 0) return null;

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <p className={styles.info} aria-live="polite">
        Showing <strong>{rangeStart}</strong>–<strong>{rangeEnd}</strong> of <strong>{total}</strong> {noun}
      </p>
      {totalPages > 1 && (
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.btn}
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <Icon name="chevron-left" size={16} />
          </button>
          <span className={styles.page}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className={styles.btn}
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
          >
            <Icon name="chevron-right" size={16} />
          </button>
        </div>
      )}
    </nav>
  );
}
