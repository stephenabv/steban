"use client";

import { Icon } from "@/components/icons/Icon";
import { useTheme } from "@/lib/theme/useTheme";
import { cn } from "@/lib/cn";
import styles from "./ThemeToggle.module.less";

interface ThemeToggleProps {
  readonly className?: string;
}

/**
 * Sun/moon light–dark switch. Which glyph shows is decided in CSS from
 * `<html data-theme>` (or the OS preference), so it is right on first paint
 * even before hydration; React only owns the pressed state and the action.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className={cn(styles.toggle, className)}
      aria-label="Dark mode"
      aria-pressed={theme === null ? undefined : theme === "dark"}
      title="Toggle light / dark mode"
      onClick={toggleTheme}
    >
      <Icon name="sun" size={18} className={cn(styles.glyph, styles.sun)} />
      <Icon name="moon" size={18} className={cn(styles.glyph, styles.moon)} />
    </button>
  );
}
