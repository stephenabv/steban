# API Reference

All API routes live under `/api/`. They accept and return JSON. All routes apply the security headers set by `proxy.ts`.

---

## Table of Contents

- [Authentication](#authentication)
  - [POST /api/auth/login](#post-apiauthlogin)
  - [POST /api/auth/logout](#post-apiauthlogout)
- [Contact](#contact)
  - [POST /api/contact](#post-apicontact)
- [Error Responses](#error-responses)
- [Rate Limiting](#rate-limiting)

---

## Authentication

### POST /api/auth/login

Authenticates the admin user and creates a session cookie.

**Request**

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

| Field | Type | Constraints |
|---|---|---|
| `username` | string | 1–100 characters |
| `password` | string | 8–256 characters |

**Success response**

```http
HTTP/1.1 200 OK
Set-Cookie: steban_session=<encrypted>; HttpOnly; Secure; SameSite=Lax; Max-Age=28800
Content-Type: application/json

{ "ok": true }
```

**Error responses**

| Status | Body | Reason |
|---|---|---|
| 400 | `{ "error": "Invalid request body" }` | Missing or malformed JSON |
| 401 | `{ "error": "Invalid credentials" }` | Wrong username or password |
| 405 | `{ "error": "Method not allowed" }` | Non-POST request |
| 429 | `{ "error": "Too many attempts. Try again in X minutes." }` | Rate limit exceeded (10 per 15 min per IP) |

**Notes**

- Credentials are validated against `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` environment variables.
- Password comparison uses `crypto.timingSafeEqual` to prevent timing attacks.
- All login attempts (success and failure) are logged via `AuditService`.

---

### POST /api/auth/logout

Destroys the current admin session.

**Request**

```http
POST /api/auth/logout
```

No request body required.

**Success response**

```http
HTTP/1.1 200 OK
Set-Cookie: steban_session=; Max-Age=0
Content-Type: application/json

{ "ok": true }
```

**Notes**

- Calling this endpoint when there is no active session is a no-op and still returns `200 { ok: true }`.

---

## Contact

### POST /api/contact

Submits a contact form message.

**Request**

```http
POST /api/contact
Content-Type: application/json

{
  "name": "string",
  "email": "string",
  "subject": "string",
  "message": "string"
}
```

| Field | Type | Constraints |
|---|---|---|
| `name` | string | 2–100 characters |
| `email` | string | Valid email format |
| `subject` | string | 3–200 characters |
| `message` | string | 10–5,000 characters |

**Success response**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{ "ok": true }
```

**Error responses**

| Status | Body | Reason |
|---|---|---|
| 400 | `{ "error": "...", "details": [...] }` | Zod validation failure; `details` contains field-level errors |
| 405 | `{ "error": "Method not allowed" }` | Non-POST request |
| 429 | `{ "error": "Too many submissions. Please wait before trying again." }` | Rate limit exceeded (5 per 60 min per IP) |
| 500 | `{ "error": "Failed to submit message" }` | Server error during persistence |

**Notes**

- All string fields are HTML-entity-escaped before storage to prevent XSS.
- The submitter's IP address is recorded with the message.
- **Currently:** the message is logged to console. To persist and email, implement `ContactService.create()` against a concrete repository.

---

## Error Responses

All error responses follow this shape:

```json
{
  "error": "Human-readable error message",
  "details": [...]  // Optional — present on validation errors
}
```

Validation error details (Zod) follow the `ZodIssue` shape:

```json
{
  "details": [
    {
      "path": ["email"],
      "message": "Invalid email"
    }
  ]
}
```

---

## Rate Limiting

Rate limits are enforced per IP address using an in-memory store. Limits reset on server restart.

| Endpoint | Limit | Window |
|---|---|---|
| `POST /api/auth/login` | 10 requests | 15 minutes |
| `POST /api/contact` | 5 requests | 60 minutes |
| General API | 60 requests | 60 seconds |

When a limit is exceeded, the response is:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "error": "Too many requests. Try again after <timestamp>."
}
```

> **Production note:** The in-memory rate limiter resets on every server restart and does not share state across multiple server instances. For production, replace with a persistent store such as Vercel KV.
