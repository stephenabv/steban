import "server-only";

/** Same-origin check — defence in depth on top of the SameSite=Lax session cookie. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

/** Best-effort client address for rate limiting and audit logs. */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Parses a JSON body no larger than `maxBytes`. Returns `undefined` when the
 * body is too large or not JSON, so callers answer with a 4xx.
 */
export async function readJsonBody(request: Request, maxBytes: number): Promise<unknown> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > maxBytes) return undefined;
  try {
    const text = await request.text();
    if (Buffer.byteLength(text, "utf-8") > maxBytes) return undefined;
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}
