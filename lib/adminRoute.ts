const DEFAULT_ADMIN_SEGMENT = "admin";

/**
 * Public-facing base path for the admin dashboard, e.g. "/admin" or "/panel-x9".
 * Configured via the `sudo_route` env var so the real URL isn't guessable.
 * Falls back to "/admin" when unset.
 */
export function getAdminBasePath(): string {
  const raw = process.env.sudo_route?.trim();
  const segment = raw ? raw.replace(/^\/+|\/+$/g, "") : "";
  return `/${segment || DEFAULT_ADMIN_SEGMENT}`;
}
