import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildCsp, securityHeaders } from "@/server/security/csp";
import { getRobotsTagHeader } from "@/server/security/robotsTag";
import { randomBytes } from "crypto";
import { getAdminBasePath } from "@/lib/adminRoute";

const ADMIN_INTERNAL_BASE = "/admin";
const API_BASE = "/api";

export async function proxy(request: NextRequest) {
  const nonce = randomBytes(16).toString("base64");
  const csp = buildCsp(nonce);
  const pathname = request.nextUrl.pathname;
  const adminBasePath = getAdminBasePath();

  const requestHeaders = new Headers({
    ...Object.fromEntries(request.headers),
    "x-nonce": nonce,
  });

  function applySecurityHeaders(res: NextResponse) {
    res.headers.set("Content-Security-Policy", csp);
    for (const { key, value } of securityHeaders) {
      res.headers.set(key, value);
    }
    const robotsTag = getRobotsTagHeader(pathname, [adminBasePath, ADMIN_INTERNAL_BASE, API_BASE]);
    if (robotsTag) {
      res.headers.set(robotsTag.key, robotsTag.value);
    }
    return res;
  }

  // When a custom sudo_route is configured, the real "/admin" path must not resolve —
  // otherwise the dashboard would be reachable from both the secret path and the guessable one.
  if (
    adminBasePath !== ADMIN_INTERNAL_BASE &&
    (pathname === ADMIN_INTERNAL_BASE || pathname.startsWith(`${ADMIN_INTERNAL_BASE}/`))
  ) {
    return applySecurityHeaders(
      NextResponse.rewrite(new URL("/admin-route-disabled", request.url))
    );
  }

  const isAdminRequest =
    pathname === adminBasePath || pathname.startsWith(`${adminBasePath}/`);

  if (!isAdminRequest) {
    return applySecurityHeaders(
      NextResponse.next({ request: { headers: requestHeaders } })
    );
  }

  const suffix = pathname.slice(adminBasePath.length);
  const internalPath = `${ADMIN_INTERNAL_BASE}${suffix}`;
  const isLoginPage = suffix === "/login";

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (!isLoginPage) {
    const sessionCookie = request.cookies.get("steban_session");

    if (!sessionCookie?.value) {
      const loginUrl = new URL(`${adminBasePath}/login`, request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return applySecurityHeaders(NextResponse.redirect(loginUrl));
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
        const loginUrl = new URL(`${adminBasePath}/login`, request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return applySecurityHeaders(NextResponse.redirect(loginUrl));
      }
    } catch {
      return applySecurityHeaders(
        NextResponse.redirect(new URL(`${adminBasePath}/login`, request.url))
      );
    }
  }

  // Public path already matches the internal route (e.g. sudo_route is unset/"admin") — nothing to rewrite.
  if (pathname === internalPath) {
    return applySecurityHeaders(response);
  }

  // Transparently map the public sudo_route path to the real app/admin/* files on disk.
  const rewritten = NextResponse.rewrite(
    new URL(`${internalPath}${request.nextUrl.search}`, request.url),
    { request: { headers: requestHeaders } }
  );
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    rewritten.headers.set("set-cookie", setCookie);
  }
  return applySecurityHeaders(rewritten);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)",
  ],
};
