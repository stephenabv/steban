/**
 * After a Server Action throws, tells an expired admin session apart from a
 * real network failure. Signed-out requests to admin pages are redirected to
 * the login page by the proxy, which the action client can't parse — so probe
 * the current page without following redirects.
 */
export async function isAdminSessionExpired(): Promise<boolean> {
  try {
    const res = await fetch(window.location.pathname, { method: "HEAD", redirect: "manual", cache: "no-store" });
    return res.type === "opaqueredirect" || res.status === 401 || res.status === 403;
  } catch {
    return false; // genuinely offline
  }
}

/** Login URL for the current admin base path (which may be a secret route). */
export function adminLoginHref(): string {
  const base = window.location.pathname.split("/").filter(Boolean)[0] ?? "admin";
  return `/${base}/login`;
}
