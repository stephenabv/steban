import {
  isTheme,
  oppositeTheme,
  THEME_COLORS,
  THEME_COOKIE,
  THEME_COOKIE_MAX_AGE_SECONDS,
  type Theme,
} from "./theme";

type Listener = () => void;

const DARK_QUERY = "(prefers-color-scheme: dark)";
const TRANSITION_CLASS = "theme-transition";
const TRANSITION_MS = 300;

/**
 * Client-side owner of the active colour theme.
 *
 * The DOM is the source of truth: `<html data-theme>` is rendered by the
 * server from the cookie, so the first paint is already correct and this
 * service only has to read it, flip it and persist the choice. Without an
 * explicit choice the OS preference applies (via CSS) and is tracked here so
 * subscribers stay in sync when it changes.
 *
 * Exposes a `useSyncExternalStore`-compatible subscribe/getSnapshot pair.
 */
export class ThemeService {
  private readonly listeners = new Set<Listener>();
  private mediaQuery: MediaQueryList | null = null;
  private transitionTimer: ReturnType<typeof setTimeout> | undefined;

  private get root(): HTMLElement {
    return document.documentElement;
  }

  /** The explicitly chosen theme, or `null` when following the OS. */
  getExplicitTheme(): Theme | null {
    const value = this.root.dataset.theme;
    return isTheme(value) ? value : null;
  }

  /** The theme currently painted, explicit or inherited from the OS. */
  getTheme(): Theme {
    return this.getExplicitTheme() ?? (window.matchMedia(DARK_QUERY).matches ? "dark" : "light");
  }

  setTheme(theme: Theme): void {
    if (!isTheme(theme)) return;

    this.withTransition(() => {
      this.root.dataset.theme = theme;
      this.syncThemeColorMeta(theme);
    });
    this.persist(theme);
    this.emit();
  }

  toggle(): void {
    this.setTheme(oppositeTheme(this.getTheme()));
  }

  // ─── useSyncExternalStore adapter ──────────────────────────────────────────
  readonly subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    if (this.listeners.size === 1) this.attachSystemListener();

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.detachSystemListener();
    };
  };

  readonly getSnapshot = (): Theme => this.getTheme();

  /** Unknown during SSR when no cookie is set; consumers must tolerate `null`. */
  readonly getServerSnapshot = (): Theme | null => null;

  // ─── Internals ─────────────────────────────────────────────────────────────
  private emit(): void {
    for (const listener of this.listeners) listener();
  }

  private readonly onSystemChange = (): void => {
    if (this.getExplicitTheme() === null) this.emit();
  };

  private attachSystemListener(): void {
    this.mediaQuery = window.matchMedia(DARK_QUERY);
    this.mediaQuery.addEventListener("change", this.onSystemChange);
  }

  private detachSystemListener(): void {
    this.mediaQuery?.removeEventListener("change", this.onSystemChange);
    this.mediaQuery = null;
  }

  /** Cross-fades colours for the flip only, so normal hovers keep their own timing. */
  private withTransition(apply: () => void): void {
    clearTimeout(this.transitionTimer);
    this.root.classList.add(TRANSITION_CLASS);
    apply();
    this.transitionTimer = setTimeout(
      () => this.root.classList.remove(TRANSITION_CLASS),
      TRANSITION_MS
    );
  }

  private syncThemeColorMeta(theme: Theme): void {
    for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
      meta.content = THEME_COLORS[theme];
      meta.removeAttribute("media");
    }
  }

  private persist(theme: Theme): void {
    const attributes = [
      `${THEME_COOKIE}=${theme}`,
      "Path=/",
      `Max-Age=${THEME_COOKIE_MAX_AGE_SECONDS}`,
      "SameSite=Lax",
      ...(window.location.protocol === "https:" ? ["Secure"] : []),
    ];
    document.cookie = attributes.join("; ");
  }
}

/** App-wide instance; only ever touched from client code paths. */
export const themeService = new ThemeService();
