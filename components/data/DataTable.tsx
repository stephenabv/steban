"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/icons/Icon";
import type { SortDirection, SortState } from "@/lib/list/ListQuery";
import { cn } from "@/lib/cn";
import styles from "./DataTable.module.less";

export interface DataColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Sort strategy id from the table's ListQuery; makes the header clickable. */
  sortId?: string;
  /** Direction applied when this column is first sorted. */
  sortInitial?: SortDirection;
  align?: "start" | "end";
  width?: string;
  /**
   * Mobile card layout: `primary` becomes the card title, `actions` the card
   * footer, `hidden` is omitted; anything else renders as a labelled row.
   */
  mobile?: "primary" | "actions" | "hidden";
  /** Visually hide the header text (still announced). */
  hideHeader?: boolean;
}

export interface DataTableProps<T> {
  caption: string;
  columns: ReadonlyArray<DataColumn<T>>;
  rows: ReadonlyArray<T>;
  getRowKey: (row: T) => string;
  sort?: SortState;
  onSort?: (id: string, initial?: SortDirection) => void;
  /** Rendered in place of the table body when there are no rows. */
  empty?: ReactNode;
  rowClassName?: (row: T) => string | undefined;
}

export function DataTable<T>({
  caption,
  columns,
  rows,
  getRowKey,
  sort,
  onSort,
  empty,
  rowClassName,
}: DataTableProps<T>) {
  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((col) => {
              const active = sort && col.sortId && sort.id === col.sortId;
              const ariaSort = active ? (sort.direction === "asc" ? "ascending" : "descending") : undefined;
              return (
                <th
                  key={col.id}
                  scope="col"
                  aria-sort={ariaSort}
                  className={cn(col.align === "end" && styles.alignEnd)}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.sortId && onSort ? (
                    <button
                      type="button"
                      className={cn(styles.sortBtn, active && styles.sortActive)}
                      onClick={() => onSort(col.sortId as string, col.sortInitial)}
                    >
                      {col.header}
                      <Icon
                        name={active ? (sort.direction === "asc" ? "arrow-up" : "arrow-down") : "sort"}
                        size={12}
                      />
                    </button>
                  ) : (
                    <span className={cn(col.hideHeader && "sr-only")}>{col.header}</span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)} className={rowClassName?.(row)}>
              {columns.map((col) => (
                <td
                  key={col.id}
                  data-label={col.header}
                  className={cn(
                    col.align === "end" && styles.alignEnd,
                    col.mobile === "primary" && styles.mobilePrimary,
                    col.mobile === "actions" && styles.mobileActions,
                    col.mobile === "hidden" && styles.mobileHidden
                  )}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
