import { getIronSession } from "iron-session";
import type { IronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  isAdmin: boolean;
  adminId?: string;
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
