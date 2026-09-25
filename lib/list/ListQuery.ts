/**
 * Client-side list querying for admin tables: search, filter, sort, paginate.
 *
 * Filters and sorts are strategy objects, so each table declares *what* it can
 * filter/sort by and the engine owns *how*. The engine is pure and framework-
 * agnostic (see useListQuery for the React binding).
 */

export type SortDirection = "asc" | "desc";

export interface FilterDefinition<T> {
  readonly id: string;
  readonly label: string;
  readonly predicate: (item: T) => boolean;
}

export interface SortDefinition<T> {
  readonly id: string;
  /** Ascending comparator; descending is derived. */
  readonly compare: (a: T, b: T) => number;
  /** Human labels per direction, used by the compact (mobile) sort picker. */
  readonly labels: Readonly<Record<SortDirection, string>>;
}

export interface SortState {
  id: string;
  direction: SortDirection;
}

export interface ListQueryState {
  search: string;
  filterId: string;
  sort: SortState;
  page: number;
  pageSize: number;
}

export interface ListQueryOptions<T> {
  /** Text fields searched (case-insensitive, all terms must match). */
  searchText: (item: T) => ReadonlyArray<string | undefined>;
  filters: ReadonlyArray<FilterDefinition<T>>;
  sorts: ReadonlyArray<SortDefinition<T>>;
}

export interface ListQueryResult<T> {
  items: T[];
  /** Matches after search + filter, before pagination. */
  total: number;
  page: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
  /** Item count per filter for the current search, e.g. "Unread (3)". */
  filterCounts: Record<string, number>;
}

export const ALL_FILTER_ID = "all";

export class ListQuery<T> {
  private readonly filtersById: ReadonlyMap<string, FilterDefinition<T>>;
  private readonly sortsById: ReadonlyMap<string, SortDefinition<T>>;

  constructor(private readonly options: ListQueryOptions<T>) {
    this.filtersById = new Map(options.filters.map((f) => [f.id, f]));
    this.sortsById = new Map(options.sorts.map((s) => [s.id, s]));
  }

  get filters(): ReadonlyArray<FilterDefinition<T>> {
    return this.options.filters;
  }

  get sorts(): ReadonlyArray<SortDefinition<T>> {
    return this.options.sorts;
  }

  apply(source: ReadonlyArray<T>, state: ListQueryState): ListQueryResult<T> {
    const searched = this.search(source, state.search);
    const filterCounts = this.countFilters(searched);
    const filtered = this.filter(searched, state.filterId);
    const sorted = this.sort(filtered, state.sort);
    return this.paginate(sorted, state.page, state.pageSize, filterCounts);
  }

  protected search(items: ReadonlyArray<T>, query: string): T[] {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [...items];

    return items.filter((item) => {
      const haystack = this.options
        .searchText(item)
        .filter((v): v is string => typeof v === "string")
        .join(" ")
        .toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }

  protected filter(items: T[], filterId: string): T[] {
    const definition = this.filtersById.get(filterId);
    return definition ? items.filter(definition.predicate) : items;
  }

  protected sort(items: T[], sort: SortState): T[] {
    const definition = this.sortsById.get(sort.id);
    if (!definition) return items;
    const factor = sort.direction === "asc" ? 1 : -1;
    // Array.prototype.sort is stable, so ties keep their source order.
    return [...items].sort((a, b) => factor * definition.compare(a, b));
  }

  private countFilters(items: T[]): Record<string, number> {
    const counts: Record<string, number> = { [ALL_FILTER_ID]: items.length };
    for (const f of this.options.filters) {
      counts[f.id] = items.filter(f.predicate).length;
    }
    return counts;
  }

  private paginate(items: T[], page: number, pageSize: number, filterCounts: Record<string, number>): ListQueryResult<T> {
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize);

    return {
      items: pageItems,
      total,
      page: safePage,
      totalPages,
      rangeStart: total === 0 ? 0 : start + 1,
      rangeEnd: start + pageItems.length,
      filterCounts,
    };
  }
}

// ─── Reusable comparators ─────────────────────────────────────────────────────
const collator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });

export const compareBy = {
  text: <T>(get: (item: T) => string) => (a: T, b: T) => collator.compare(get(a), get(b)),
  date: <T>(get: (item: T) => string | Date) => (a: T, b: T) =>
    new Date(get(a)).getTime() - new Date(get(b)).getTime(),
  boolean: <T>(get: (item: T) => boolean) => (a: T, b: T) => Number(get(a)) - Number(get(b)),
};
