import { getIronSession } from "iron-session";
import type { IronSession } from "iron-session";
import { cookies } from "next/headers";
import type { PendingChallenge } from "./passkeys/challenge";

export interface SessionData {
  isAdmin: boolean;
  adminId?: string;
  /** Epoch ms of the last sign-in. Gates sensitive changes such as adding a passkey. */
  authenticatedAt?: number;
  /** In-flight WebAuthn ceremony. Single use and short-lived. */
  webauthnChallenge?: PendingChallenge;
}

const MIN_SECRET_LENGTH = 32;

/** iron-session refuses shorter secrets; check up front to return a clear error. */
export function isSessionSecretConfigured(): boolean {
  return (process.env.SESSION_SECRET?.length ?? 0) >= MIN_SECRET_LENGTH;
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, {
    password: process.env.SESSION_SECRET as string,
    cookieName: "steban_session",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 8,
    },
  });
}

export async function requireAdminSession(): Promise<IronSession<SessionData>> {
  const session = await getSession();
  if (!session.isAdmin) {
    throw new Error("Unauthorized");
  }
  return session;
}
