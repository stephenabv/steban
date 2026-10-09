"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchQuery } from "@/lib/search/SearchQuery";
import type { AdminSearchGroup, AdminSearchResponse } from "@/lib/search/AdminSearchResult";
import { searchAdminAction } from "./searchActions";

const DEBOUNCE_MS = 180;
const NETWORK_ERROR = "Search is unavailable right now. Check your connection and try again.";

export interface AdminSearchState {
  /** Record groups for the latest settled query (kept while the next one loads). */
  groups: AdminSearchGroup[];
  loading: boolean;
  error: string | null;
  /** Groups that could not be searched for this query. */
  unavailable: string[];
}

/** Debounced server search over admin records; responses for outdated input are dropped. */
export function useAdminSearch(input: string): AdminSearchState {
  const query = useMemo(() => SearchQuery.parse(input)?.text ?? null, [input]);
  const [settled, setSettled] = useState<{ query: string; response: AdminSearchResponse } | null>(
    null
  );

  useEffect(() => {
    if (!query) return;
    let current = true;
    const timer = window.setTimeout(async () => {
      let response: AdminSearchResponse;
      try {
        response = await searchAdminAction(query);
      } catch {
        response = { ok: false, error: NETWORK_ERROR };
      }
      if (current) setSettled({ query, response });
    }, DEBOUNCE_MS);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  if (!query) return { groups: [], loading: false, error: null, unavailable: [] };

  const response = settled?.response;
  const fresh = settled?.query === query;
  return {
    groups: response?.ok ? response.groups : [],
    loading: !fresh,
    error: fresh && response && !response.ok ? response.error : null,
    unavailable: fresh && response?.ok ? response.unavailable : [],
  };
}
