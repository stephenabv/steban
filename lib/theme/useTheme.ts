"use client";

import { useSyncExternalStore } from "react";
import { themeService } from "./ThemeService";
import type { Theme } from "./theme";

interface UseThemeResult {
  /** `null` until hydrated when the server could not know the theme. */
  readonly theme: Theme | null;
  readonly setTheme: (theme: Theme) => void;
  readonly toggleTheme: () => void;
}

export function useTheme(): UseThemeResult {
  const theme = useSyncExternalStore(
    themeService.subscribe,
    themeService.getSnapshot,
    themeService.getServerSnapshot
  );

  return {
    theme,
    setTheme: (next) => themeService.setTheme(next),
    toggleTheme: () => themeService.toggle(),
  };
}
