import "server-only";
import { getSession } from "@/server/auth/session";

/** The authenticated admin a request acts as. */
export interface AdminPrincipal {
  /** Scopes every owned record. Single-admin today; a stable id for multi-user later. */
  ownerId: string;
}

const DEFAULT_OWNER_ID = "admin";

/**
 * Re-checks the admin session on the server. Server Actions and route
 * handlers are public HTTP endpoints, so each one calls this itself rather
 * than relying on the proxy or hidden UI.
 */
export async function requireAdmin(): Promise<AdminPrincipal | null> {
  const session = await getSession();
  if (session.isAdmin !== true) return null;
  return { ownerId: session.adminId || DEFAULT_OWNER_ID };
}
