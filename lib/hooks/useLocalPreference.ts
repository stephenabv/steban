import { useCallback, useSyncExternalStore } from "react";

const EVENT = "local-preference-change";

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null; // storage blocked (privacy mode, policies)
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

/**
 * A boolean UI preference persisted in localStorage (e.g. a collapsed sidebar).
 * Hydration-safe: the server snapshot is always `fallback`.
 */
export function useLocalPreference(key: string, fallback: boolean): [boolean, (value: boolean) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => {
      const raw = read(key);
      return raw === null ? fallback : raw === "true";
    },
    () => fallback
  );

  const setValue = useCallback(
    (next: boolean) => {
      try {
        window.localStorage.setItem(key, String(next));
      } catch {
        // Non-persistent fallback is acceptable for a cosmetic preference.
      }
      window.dispatchEvent(new Event(EVENT));
    },
    [key]
  );

  return [value, setValue];
}
