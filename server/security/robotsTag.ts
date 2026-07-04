// Shared header-policy: routes that must stay out of search results carry
// X-Robots-Tag on the HTTP response itself, regardless of status code
// (redirect, rewrite, or rendered page). This is enforced here rather than
// per-route so it can't be forgotten when a new admin or API route is added,
// and it keeps sensitive paths out of robots.txt (see server/seo/RobotsService.ts).
export function getRobotsTagHeader(
  pathname: string,
  noindexBasePaths: string[]
): { key: string; value: string } | null {
  const matches = noindexBasePaths.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`)
  );

  return matches ? { key: "X-Robots-Tag", value: "noindex, nofollow" } : null;
}
