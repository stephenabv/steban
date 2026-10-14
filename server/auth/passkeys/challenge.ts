export type CeremonyPurpose = "registration" | "authentication";

/** A WebAuthn challenge kept in the encrypted session cookie until it is used. */
export interface PendingChallenge {
  value: string;
  purpose: CeremonyPurpose;
  /** Epoch ms. */
  expiresAt: number;
}

export const CHALLENGE_TTL_MS = 5 * 60 * 1000;

export function issueChallenge(
  value: string,
  purpose: CeremonyPurpose,
  now = Date.now()
): PendingChallenge {
  return { value, purpose, expiresAt: now + CHALLENGE_TTL_MS };
}

/**
 * Removes the pending challenge from the session and returns it if it is
 * still valid for `purpose`. Always removes it, so a challenge is never
 * accepted twice; callers persist the session afterwards.
 */
export function consumeChallenge(
  session: { webauthnChallenge?: PendingChallenge },
  purpose: CeremonyPurpose,
  now = Date.now()
): string | null {
  const pending = session.webauthnChallenge;
  delete session.webauthnChallenge;
  if (!pending || pending.purpose !== purpose || now > pending.expiresAt) return null;
  return pending.value;
}
