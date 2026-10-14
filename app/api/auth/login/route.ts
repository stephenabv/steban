import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit, rateLimitPolicies } from "@/server/security/rateLimit";
import { adminLoginSchema } from "@/server/security/validation";
import { getSession, isSessionSecretConfigured } from "@/server/auth/session";
import { signInAdmin } from "@/server/auth/adminSession";
import { comparePassword } from "@/server/security/crypto";
import { getClientIp } from "@/server/http/requestGuards";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  const limit = rateLimit(`admin-login:${ip}`, rateLimitPolicies.adminLogin);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 422 });
  }

  const { username, password } = parsed.data;

  if (
    !process.env.ADMIN_USERNAME ||
    !process.env.ADMIN_PASSWORD_HASH ||
    username !== process.env.ADMIN_USERNAME
  ) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const valid = await comparePassword(password, process.env.ADMIN_PASSWORD_HASH);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  if (!isSessionSecretConfigured()) {
    return NextResponse.json(
      { error: "Server misconfigured: SESSION_SECRET must be at least 32 characters." },
      { status: 500 }
    );
  }

  const session = await getSession();
  signInAdmin(session, "admin");
  await session.save();

  return NextResponse.json({ ok: true });
}
