import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { contactFormSchema } from "@/server/security/validation";
import { rateLimit, rateLimitPolicies } from "@/server/security/rateLimit";
import { sanitizeHtml } from "@/server/security/validation";

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

  // Sanitize before any persistence/email
  const safeEntry = {
    name: sanitizeHtml(name),
    email,
    subject: sanitizeHtml(subject),
    message: sanitizeHtml(message),
    ip,
    createdAt: new Date(),
  };

  // TODO: persist via ContactService when DB is wired up
  // TODO: send notification email
  console.warn("[ContactAPI] New message:", { from: safeEntry.email, subject: safeEntry.subject });

  return NextResponse.json({ ok: true }, { status: 200 });
}
