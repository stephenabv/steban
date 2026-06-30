import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildCsp, securityHeaders } from "@/server/security/csp";
import { randomBytes } from "crypto";

export async function proxy(request: NextRequest) {
  const nonce = randomBytes(16).toString("base64");
  const csp = buildCsp(nonce);

  const response = NextResponse.next({
    request: {
      headers: new Headers({
        ...Object.fromEntries(request.headers),
        "x-nonce": nonce,
      }),
    },
  });

  response.headers.set("Content-Security-Policy", csp);

  for (const { key, value } of securityHeaders) {
    response.headers.set(key, value);
  }

  // Admin route protection (allow login page through)
  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");
  const isLoginPage = request.nextUrl.pathname === "/admin/login";

  if (isAdminPath && !isLoginPage) {
    const sessionCookie = request.cookies.get("steban_session");

    if (!sessionCookie?.value) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { getIronSession } = await import("iron-session");
      // iron-session v8 supports standard Web Request/Response (NextRequest extends Request)
      const session = await getIronSession<{ isAdmin?: boolean }>(
        request as unknown as Request,
        response as unknown as Response,
        {
          password: process.env.SESSION_SECRET as string,
          cookieName: "steban_session",
        }
      );

      if (!session.isAdmin) {
        const loginUrl = new URL("/admin/login", request.url);
        loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)",
  ],
};
