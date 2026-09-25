"use client";

import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { ALL_FILTER_ID } from "./ListQuery";
import type { ListQuery, ListQueryResult, ListQueryState, SortDirection, SortState } from "./ListQuery";

export interface UseListQuery<T> {
  state: ListQueryState;
  result: ListQueryResult<T>;
  setSearch: (search: string) => void;
  setFilter: (filterId: string) => void;
  setSort: (sort: SortState) => void;
  /** Column-header behaviour: same column flips direction, a new column starts at `initial`. */
  toggleSort: (id: string, initial?: SortDirection) => void;
  setPage: (page: number) => void;
  reset: () => void;
  isFiltered: boolean;
}

export function useListQuery<T>(
  items: ReadonlyArray<T>,
  query: ListQuery<T>,
  initial: { sort: SortState; pageSize?: number }
): UseListQuery<T> {
  const initialState: ListQueryState = {
    search: "",
    filterId: ALL_FILTER_ID,
    sort: initial.sort,
    page: 1,
    pageSize: initial.pageSize ?? 10,
  };
  const [state, setState] = useState<ListQueryState>(initialState);
  // Keep typing responsive on large lists: filter against a deferred query.
  const deferredSearch = useDeferredValue(state.search);

  const result = useMemo(
    () => query.apply(items, { ...state, search: deferredSearch }),
    [items, query, state, deferredSearch]
  );

  // Any change that alters the result set returns to page 1 — done in the
  // setters, not an effect, so there is never a render with a stale page.
  const setSearch = useCallback((search: string) => setState((s) => ({ ...s, search, page: 1 })), []);
  const setFilter = useCallback((filterId: string) => setState((s) => ({ ...s, filterId, page: 1 })), []);
  const setSort = useCallback((sort: SortState) => setState((s) => ({ ...s, sort, page: 1 })), []);
  const toggleSort = useCallback(
    (id: string, initialDirection: SortDirection = "asc") =>
      setState((s) => ({
        ...s,
        page: 1,
        sort:
          s.sort.id === id
            ? { id, direction: s.sort.direction === "asc" ? "desc" : "asc" }
            : { id, direction: initialDirection },
      })),
    []
  );
  const setPage = useCallback((page: number) => setState((s) => ({ ...s, page })), []);
  const reset = useCallback(
    () => setState((s) => ({ ...s, search: "", filterId: ALL_FILTER_ID, page: 1 })),
    []
  );

  return {
    state,
    result,
    setSearch,
    setFilter,
    setSort,
    toggleSort,
    setPage,
    reset,
    isFiltered: state.search.trim() !== "" || state.filterId !== ALL_FILTER_ID,
  };
}
