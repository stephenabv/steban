import type { SessionData } from "./session";

/** How long after signing in the admin may make sensitive changes without signing in again. */
export const RECENT_SIGN_IN_WINDOW_MS = 10 * 60 * 1000;

/** Marks the session as the given admin. Callers persist it with `session.save()`. */
export function signInAdmin(session: SessionData, ownerId: string, now = Date.now()): void {
  session.isAdmin = true;
  session.adminId = ownerId;
  session.authenticatedAt = now;
  delete session.webauthnChallenge;
}

/**
 * A stolen session cookie must not be enough to enrol a new long-lived
 * credential, so sensitive changes require a sign-in within the window.
 */
export function isRecentSignIn(session: SessionData, now = Date.now()): boolean {
  const at = session.authenticatedAt;
  return typeof at === "number" && at <= now && now - at <= RECENT_SIGN_IN_WINDOW_MS;
}
