import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { contactFormSchema } from "@/server/security/validation";
import { rateLimit, rateLimitPolicies } from "@/server/security/rateLimit";
import { getContactService } from "@/server/services";

// Persistence must run on the Node.js runtime (pg is not Edge-compatible) and
// must never be statically cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const limit = rateLimit(`contact:${ip}`, rateLimitPolicies.contactForm);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = contactFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const { name, email, subject, message } = parsed.data;

  // Store the validated raw input. Output is escaped at render time (React
  // auto-escapes), which is the correct XSS boundary — escaping on input would
  // double-encode and corrupt the stored message.
  const result = await getContactService().submitMessage({
    name,
    email,
    subject,
    message,
    ip,
  });

  if (!result.ok) {
    // Log the real cause server-side; never leak internals to the client.
    console.error("[ContactAPI] Failed to persist message:", result.error.message);
    return NextResponse.json(
      { error: "Could not send your message right now. Please try again shortly." },
      { status: 500 }
    );
  }

  // TODO: send notification email (out of scope for persistence fix).
  return NextResponse.json({ ok: true }, { status: 200 });
}
