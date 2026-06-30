# Security

This document describes the security architecture and the measures in place to protect the application and its users.

**Target standard:** OWASP ASVS Level 2.

---

## Table of Contents

- [Authentication](#authentication)
- [Session Management](#session-management)
- [Password Hashing](#password-hashing)
- [Content Security Policy](#content-security-policy)
- [Security Headers](#security-headers)
- [Rate Limiting](#rate-limiting)
- [Input Validation & Output Encoding](#input-validation--output-encoding)
- [Admin Route Guard](#admin-route-guard)
- [Audit Logging](#audit-logging)
- [Known Limitations](#known-limitations)

---

## Authentication

Admin authentication is handled by `server/auth/AuthService.ts`.

**How it works:**

1. The admin submits a username and password via `POST /api/auth/login`.
2. The API route checks the rate limit (10 attempts per 15 minutes per IP).
3. `AuthService.login()` compares the submitted username to the `ADMIN_USERNAME` environment variable.
4. The submitted password is compared against `ADMIN_PASSWORD_HASH` using a timing-safe scrypt comparison.
5. On success, an iron-session cookie is issued with `isAdmin: true`.
6. On failure, the error is logged via `AuditService` and a generic `"Invalid credentials"` message is returned (the response does not indicate whether the username or password was wrong).

**Credentials are stored only in environment variables** — not in the database. This prevents credential exposure in the event of a database breach.

---

## Session Management

**Library:** [iron-session](https://github.com/vvo/iron-session)

**Configuration (`server/auth/session.ts`):**

| Setting | Value |
|---|---|
| Cookie name | `steban_session` |
| Encryption key | `SESSION_SECRET` env var (min 32 chars) |
| TTL | 8 hours (28,800 seconds) |
| HttpOnly | Yes (prevents JavaScript access) |
| Secure | Yes (HTTPS only in production) |
| SameSite | Lax (CSRF protection) |

**Session shape:**

```ts
interface SessionData {
  isAdmin?: boolean;
  adminId?: string;
}
```

The session is destroyed completely on logout (`POST /api/auth/logout`). There is no refresh token — re-authentication is required after expiry.

---

## Password Hashing

**Algorithm:** `crypto.scryptSync` (Node.js built-in)

**Implementation (`server/security/crypto.ts`):**

```ts
// Hash a password (run once, store the output as ADMIN_PASSWORD_HASH)
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

// Verify a submitted password (used on every login attempt)
function comparePassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const incoming = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return timingSafeEqual(incoming, expected);  // Prevents timing attacks
}
```

**Why scrypt:** scrypt is a memory-hard key derivation function that is resistant to GPU and ASIC brute-force attacks. The Node.js built-in implementation avoids any third-party dependency for this critical operation.

**Why `timingSafeEqual`:** A naive string comparison (`===`) exits early on the first mismatched character, leaking information about how close a guess was. `timingSafeEqual` always takes the same amount of time regardless of where the mismatch occurs.

---

## Content Security Policy

The CSP is built and injected per-request in `proxy.ts` using `server/security/csp.ts`.

**Why per-request?** The `script-src` directive uses a nonce (`'nonce-<random>'`). A nonce is generated freshly for each request — this allows inline scripts (e.g. GA4, Next.js hydration) to execute while blocking injected scripts that don't carry the nonce.

**CSP directives:**

| Directive | Value |
|---|---|
| `default-src` | `'self'` |
| `script-src` | `'self' 'nonce-{nonce}' https://www.googletagmanager.com https://www.google-analytics.com` (+ `'unsafe-eval'` in development only) |
| `style-src` | `'self' 'unsafe-inline'` |
| `img-src` | `'self' data: blob: https:` |
| `font-src` | `'self' data:` |
| `connect-src` | `'self' https://www.google-analytics.com` |
| `form-action` | `'self'` |
| `frame-ancestors` | `'none'` |
| `base-uri` | `'self'` |
| `upgrade-insecure-requests` | (present in production) |

**`unsafe-inline` on styles:** Required by LESS-compiled CSS Modules that inject a small inline style at runtime. This is a known trade-off; `style-src` CSP nonces would require changes to the build toolchain.

---

## Security Headers

Set on every response by `proxy.ts` via the `securityHeaders` export from `server/security/csp.ts`.

| Header | Value | Purpose |
|---|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Enforces HTTPS for 2 years including subdomains |
| `X-Frame-Options` | `DENY` | Prevents clickjacking (redundant with CSP `frame-ancestors` — belt and suspenders) |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer information sent to third parties |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disables unused browser features |
| `X-Powered-By` | (removed) | Hides the server technology fingerprint (`poweredByHeader: false` in `next.config.ts`) |

---

## Rate Limiting

Implemented in `server/security/rateLimit.ts` using an in-memory store.

```ts
rateLimit(key: string, options: { max: number; windowMs: number })
  → { allowed: boolean; remaining: number; resetAt: Date }
```

**Policies:**

| Context | Key format | Max requests | Window |
|---|---|---|---|
| Admin login | `login:{ip}` | 10 | 15 minutes |
| Contact form | `contact:{ip}` | 5 | 60 minutes |
| General API | `api:{ip}` | 60 | 60 seconds |

**Limitation:** The store is in-memory and resets on server restart. It does not share state across multiple server instances. For production, replace with a persistent store:

```ts
// Example: Vercel KV-backed rate limiter
import { kv } from '@vercel/kv';

async function rateLimit(key: string, options: { max: number; windowMs: number }) {
  const count = await kv.incr(key);
  if (count === 1) {
    await kv.expire(key, Math.floor(options.windowMs / 1000));
  }
  return { allowed: count <= options.max, remaining: Math.max(0, options.max - count) };
}
```

---

## Input Validation & Output Encoding

### Validation

All API inputs are validated with [Zod](https://zod.dev) schemas defined in `server/security/validation.ts`.

```ts
// Contact form
const contactFormSchema = z.object({
  name:    z.string().min(2).max(100),
  email:   z.string().email(),
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(5000),
});

// Admin login
const adminLoginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(8).max(256),
});
```

Validation happens at the API boundary — **before** any business logic runs. Invalid requests are rejected with a 400 response and field-level error details.

### Output encoding

All string fields submitted through the contact form are HTML-entity-escaped before storage:

```ts
function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

This prevents stored XSS in the admin messages view.

---

## Admin Route Guard

The admin auth guard lives in `proxy.ts` (Next.js middleware) and runs on every request matching `/admin/:path*` (excluding `/admin/login`).

```
Incoming request to /admin/*
  └── Read iron-session cookie
      ├── Valid session (isAdmin === true) → continue to page
      └── Invalid / missing session → 302 redirect to /admin/login
```

Placing the guard in middleware rather than individual page components means:

- It is impossible to accidentally forget the auth check in a new admin page.
- The check runs before any server component code executes, so no data is fetched for unauthenticated requests.

---

## Audit Logging

`server/services/AuditService.ts` records security events.

**Currently logged events:**
- Admin login success (username, IP, timestamp).
- Admin login failure (username, IP, timestamp, reason).
- Admin logout.

**Current output:** Console (`console.log` / `console.warn`). In production, replace with a structured logging sink (e.g. Vercel Log Drains, Datadog, or a Postgres `audit_log` table).

---

## Known Limitations

| Limitation | Mitigation / Recommendation |
|---|---|
| In-memory rate limiter resets on restart | Replace with Vercel KV or Redis for persistent limits |
| In-memory rate limiter does not scale horizontally | Same fix as above |
| Single admin account | Sufficient for a personal portfolio; add multi-user support if needed |
| No CSRF token on API routes | `SameSite=Lax` on the session cookie provides CSRF protection for same-site form submissions; if cross-site form submissions are ever needed, add a CSRF token |
| `style-src: 'unsafe-inline'` | Required by LESS CSS Modules; low risk for a portfolio site |
| Audit logs go to console | Replace `AuditService` with a structured logging sink for production observability |
