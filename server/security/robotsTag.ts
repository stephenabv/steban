// Shared header-policy: routes that must stay out of search results carry
// X-Robots-Tag on the HTTP response itself, regardless of status code
// (redirect, rewrite, or rendered page). This is enforced here rather than
// per-route so it can't be forgotten when a new admin or API route is added,
// and it keeps sensitive paths out of robots.txt (see server/seo/RobotsService.ts).

const NOINDEX = { key: "X-Robots-Tag", value: "noindex, nofollow" } as const;

/**
 * Vercel only adds `noindex` to preview deployments. The production
 * `*.vercel.app` alias serves the same pages as the custom domain, so it is
 * kept out of the index to avoid duplicate content; canonical links already
 * point at the custom domain.
 * https://vercel.com/kb/guide/avoiding-duplicate-content-with-vercel-app-urls
 */
export function isPlatformHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === "vercel.app" || host.endsWith(".vercel.app");
}

export function getRobotsTagHeader(
  pathname: string,
  noindexBasePaths: string[],
  hostname = ""
): { key: string; value: string } | null {
  if (isPlatformHost(hostname)) return NOINDEX;

  const matches = noindexBasePaths.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`)
  );

  return matches ? NOINDEX : null;
}
