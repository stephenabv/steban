# Security

This document describes the security architecture and the measures in place to protect the application and its users.

**Target standard:** OWASP ASVS Level 2.

---

## Table of Contents

- [Authentication](#authentication)
- [Passkeys](#passkeys)
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

## Passkeys

The admin can also sign in with a passkey (WebAuthn). Password sign-in stays available as a fallback.

**Library:** [SimpleWebAuthn](https://simplewebauthn.dev) (`@simplewebauthn/server` and `@simplewebauthn/browser`).

**Code:** `server/auth/passkeys/` (ceremonies), `server/http/PasskeyEndpoints.ts` (HTTP), `server/repositories/*PasskeyRepository.ts` (storage, table `admin_passkeys`), admin page at `/admin/passkeys`.

| Endpoint | Access | Purpose |
|---|---|---|
| `POST /api/auth/passkey/options` | Public, rate limited | Sign-in challenge |
| `POST /api/auth/passkey/verify` | Public, rate limited | Verify the assertion and start the session |
| `POST /api/admin/passkeys/options` | Admin, signed in within 10 min | Registration challenge |
| `POST /api/admin/passkeys` | Admin, signed in within 10 min | Verify and store a new passkey |

**Controls:**

- **User verification required** on every ceremony (biometric or device PIN), so a passkey is a complete second factor on its own.
- **Usernameless sign-in** with discoverable credentials; the browser offers the passkeys it has for this site. The returned user handle must match the stored passkey's owner.
- **One-time challenges** are stored in the encrypted session cookie, tagged with their ceremony and a 5-minute expiry, and removed on first use whether or not verification succeeds.
- **Origin and RP ID** are checked by the library against the request's origin, or against `WEBAUTHN_RP_ID` / `WEBAUTHN_ORIGINS` when set. A forged `Host` header can't make a foreign assertion verify: the browser writes the origin into the signed client data and authenticators bind credentials to the RP ID.
- **Signature counters** only move forward. The check runs in the `UPDATE` itself, so it holds across serverless instances; a counter that doesn't advance rejects the sign-in (possible cloned authenticator). Synced passkeys report 0 and are exempt, as the spec intends.
- **Recent sign-in for enrolment:** adding a passkey needs a sign-in from the last 10 minutes (`authenticatedAt` in the session), so a stolen session cookie can't enrol an attacker's passkey for lasting access. Sessions from before this change have no timestamp and must sign in again.
- **Same-origin check** on all four endpoints (`Origin` must match `Host`), on top of `SameSite=Lax`.
- **Only public keys are stored.** Sign-in failures return one generic message and are audit-logged with the reason.

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
  isAdmin: boolean;
  adminId?: string;
  authenticatedAt?: number; // epoch ms of the last sign-in
  webauthnChallenge?: { value: string; purpose: "registration" | "authentication"; expiresAt: number };
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
| Passkey challenges live in the stateless session cookie | A challenge is cleared after use, but an attacker holding both an old copy of the cookie and a captured assertion could replay it within the 5-minute window. Synced passkeys (counter 0) don't catch this. Store challenges server-side (e.g. Redis) to close it fully |
