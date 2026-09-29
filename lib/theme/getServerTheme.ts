import "server-only";
import { cookies } from "next/headers";
import { isTheme, THEME_COOKIE, type Theme } from "./theme";

/**
 * The visitor's explicit theme choice, or `null` when none is stored — the
 * stylesheet then follows `prefers-color-scheme`. Unknown values are ignored.
 */
export async function getServerTheme(): Promise<Theme | null> {
  const value = (await cookies()).get(THEME_COOKIE)?.value;
  return isTheme(value) ? value : null;
}
