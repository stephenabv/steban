import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * `true` after hydration, `false` during SSR and the hydration pass —
 * the hydration-safe way to gate portals and browser-only APIs.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
