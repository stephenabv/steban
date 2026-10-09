/**
 * Theme contract shared by the server (initial `data-theme` from the cookie)
 * and the client ThemeService. Isomorphic — no browser or Node APIs here.
 */
export const THEMES = ["light", "dark"] as const;

export type Theme = (typeof THEMES)[number];

/** Non-sensitive UI preference; readable by JS by design (the client writes it). */
export const THEME_COOKIE = "theme";

export const THEME_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** Browser chrome colour per theme — mirrors --color-bg in styles/themes.less. */
export const THEME_COLORS: Readonly<Record<Theme, string>> = {
  dark: "#0b0d10",
  light: "#f6f7f9",
};

/** Allow-list guard: cookie values are user-controlled input. */
export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

export function oppositeTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}
