"use client";

import type { ReactNode } from "react";
import { SearchInput, Select } from "@/components/ui/Field";
import { ALL_FILTER_ID } from "@/lib/list/ListQuery";
import type { FilterDefinition, SortDefinition, SortState } from "@/lib/list/ListQuery";
import { cn } from "@/lib/cn";
import styles from "./DataToolbar.module.less";

export interface DataToolbarProps<T> {
  searchLabel: string;
  searchPlaceholder?: string;
  search: string;
  onSearch: (value: string) => void;
  filters?: ReadonlyArray<FilterDefinition<T>>;
  filterId?: string;
  filterCounts?: Record<string, number>;
  onFilter?: (id: string) => void;
  allLabel?: string;
  sorts?: ReadonlyArray<SortDefinition<T>>;
  sort?: SortState;
  onSort?: (sort: SortState) => void;
  /** Extra controls (e.g. bulk actions) aligned to the end. */
  actions?: ReactNode;
}

export function DataToolbar<T>({
  searchLabel,
  searchPlaceholder,
  search,
  onSearch,
  filters,
  filterId = ALL_FILTER_ID,
  filterCounts,
  onFilter,
  allLabel = "All",
  sorts,
  sort,
  onSort,
  actions,
}: DataToolbarProps<T>) {
  const filterOptions = filters && onFilter ? [{ id: ALL_FILTER_ID, label: allLabel }, ...filters] : [];

  return (
    <div className={styles.toolbar}>
      <SearchInput
        label={searchLabel}
        placeholder={searchPlaceholder ?? "Search…"}
        value={search}
        onValueChange={onSearch}
        className={styles.search}
      />

      {filterOptions.length > 0 && (
        <div className={styles.segmented} role="group" aria-label="Filter">
          {filterOptions.map((f) => (
            <button
              key={f.id}
              type="button"
              className={cn(styles.segment, filterId === f.id && styles.segmentActive)}
              aria-pressed={filterId === f.id}
              onClick={() => onFilter?.(f.id)}
            >
              {f.label}
              {filterCounts && <span className={styles.count}>{filterCounts[f.id] ?? 0}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Headers are hidden in the mobile card layout, so sorting moves here. */}
      {sorts && sort && onSort && (
        <Select
          aria-label="Sort by"
          className={styles.sortSelect}
          value={`${sort.id}:${sort.direction}`}
          onChange={(e) => {
            const [id, direction] = e.target.value.split(":");
            onSort({ id, direction: direction === "desc" ? "desc" : "asc" });
          }}
        >
          {sorts.flatMap((s) =>
            (["desc", "asc"] as const).map((dir) => (
              <option key={`${s.id}:${dir}`} value={`${s.id}:${dir}`}>
                {s.labels[dir]}
              </option>
            ))
          )}
        </Select>
      )}

      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
