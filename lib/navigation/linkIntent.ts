/** Paths ending in a file extension (e.g. /resume.pdf) are documents or downloads, not app routes. */
const FILE_PATH = /\.[a-z0-9]+$/i;

/**
 * Resolves a click to the in-app pathname it will navigate to, or `null`
 * when the click will not produce a client-side route change we should cover:
 * modified/non-primary clicks, new-tab or download links, other origins,
 * files, and same-page links (hash or query-only changes).
 */
export function resolveNavigationTarget(event: MouseEvent, currentPathname: string): string | null {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return null;
  }

  const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
  if (!(anchor instanceof HTMLAnchorElement)) return null;
  if (anchor.hasAttribute("download")) return null;
  if (anchor.target && anchor.target !== "_self") return null;

  let url: URL;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return null;
  }

  if (url.origin !== window.location.origin) return null;
  if (FILE_PATH.test(url.pathname)) return null;
  if (url.pathname === currentPathname) return null;

  return url.pathname;
}
