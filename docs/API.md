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

## Resume

### POST /api/admin/resume

Uploads a resume PDF and makes it the active resume. **Admin session required.**

| | |
|---|---|
| Auth | `steban_session` cookie with `isAdmin`; `Origin` must match the host |
| Body | `multipart/form-data` with a single `file` field |
| Limits | PDF only (validated by content: `%PDF-` header and `%%EOF` trailer), max 4 MB |

The swap is atomic: if validation or storage fails, the current resume stays active.

| Status | Meaning |
|---|---|
| `200` | `{ "ok": true, "file": { fileName, contentType, sizeBytes, sha256, uploadedAt } }` |
| `400` | No file / unreadable form data |
| `401` / `403` | Not signed in / cross-origin request |
| `413` | File larger than 4 MB |
| `422` | Not a PDF, empty, or truncated/corrupted |
| `500` | Storage failed — `"Your current resume is unchanged."` |

### GET /resume.pdf

Public. Streams the active resume (`Content-Type: application/pdf`, `inline`; add `?download=1`
for `attachment`). Responses carry an `ETag` (SHA-256) with `Cache-Control: public, max-age=0,
must-revalidate`, so a replaced resume is served immediately and unchanged files return `304`.
Returns `404` when no resume has been uploaded.

---

## Profile photo

### POST /api/admin/profile-photo

Uploads the hero profile photo and makes it the active one. Same auth, body, atomic swap and
status codes as `POST /api/admin/resume`, except the accepted formats: **JPEG, PNG or WebP**,
recognised by signature and checked for truncation (PNG `IEND`, JPEG `EOI`, WebP RIFF size).
SVG and anything else is rejected with `422`. Max 4 MB.

### DELETE /api/admin/profile-photo

Removes the active photo; the home page falls back to initials. **Admin session required**,
same-origin only. `200 { "ok": true, "removed": boolean }`.

### GET /profile-photo/{version}

Public. Streams the active photo. When `{version}` matches the current photo's hash prefix the
response is `Cache-Control: public, max-age=31536000, immutable`; a stale version still returns
the current photo but with `max-age=0, must-revalidate`. `404` when no photo is uploaded.
`next/image` optimises this path only (`images.localPatterns`, no query strings).

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
