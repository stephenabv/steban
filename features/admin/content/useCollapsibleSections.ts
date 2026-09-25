"use client";

import { useCallback, useMemo, useState } from "react";

/** Open/closed state for a fixed set of editor sections (all open by default). */
export function useCollapsibleSections<K extends string>(keys: readonly K[]) {
  const [closed, setClosed] = useState<ReadonlySet<K>>(() => new Set());

  const isOpen = useCallback((key: K) => !closed.has(key), [closed]);

  const toggle = useCallback((key: K) => {
    setClosed((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const setAll = useCallback((open: boolean) => setClosed(open ? new Set() : new Set(keys)), [keys]);

  /** Opens the given sections (e.g. those with validation errors), leaving others as they are. */
  const reveal = useCallback((toOpen: readonly K[]) => {
    if (toOpen.length === 0) return;
    setClosed((current) => {
      if (!toOpen.some((k) => current.has(k))) return current;
      const next = new Set(current);
      for (const k of toOpen) next.delete(k);
      return next;
    });
  }, []);

  return useMemo(
    () => ({ isOpen, toggle, setAll, reveal, allOpen: closed.size === 0, allClosed: closed.size === keys.length }),
    [isOpen, toggle, setAll, reveal, closed.size, keys.length]
  );
}
