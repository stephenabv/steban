# Architecture

This document describes the system design, data flow, and layer responsibilities of the portfolio application.

---

## Table of Contents

- [Overview](#overview)
- [Directory Layout by Concern](#directory-layout-by-concern)
- [Layer Responsibilities](#layer-responsibilities)
- [Request Lifecycle](#request-lifecycle)
- [Authentication Flow](#authentication-flow)
- [Data Flow Diagram](#data-flow-diagram)
- [Key Design Decisions](#key-design-decisions)

---

## Overview

The application follows a **three-layer server architecture** on top of Next.js App Router:

```
Presentation (React / Next.js pages)
      ↓
Service Layer (business logic)
      ↓
Repository Layer (data access abstraction)
      ↓
Database (Vercel Postgres — plugged in externally)
```

The presentation layer is split between **public pages** (visible to everyone) and an **admin dashboard** (gated behind authentication). All sensitive logic lives in `server/` and is never imported by client components.

---

## Directory Layout by Concern

```
app/            ← Next.js routing, page components, API routes
components/     ← Shared UI (Navbar, Footer, GoogleAnalytics)
features/       ← Feature-scoped client components per domain area
server/         ← Backend code (never runs on the client)
  domain/       ← Entities (data shapes) + utility types
  repositories/ ← Abstract data access interfaces
  services/     ← Business logic; consumed by pages and API routes
  auth/         ← Session management + AuthService
  security/     ← CSP, rate limiting, crypto, Zod schemas
config/         ← Static configuration (site meta, social, analytics)
lib/            ← Pure helper utilities (JSON-LD generators)
styles/         ← LESS design tokens, global styles
proxy.ts        ← Next.js middleware (security headers, auth guard)
```

---

## Layer Responsibilities

### Middleware (`proxy.ts`)

Runs on every request before any page or API handler:

- Generates a per-request CSP nonce and injects it into response headers.
- Applies all security headers (HSTS, X-Frame-Options, etc.).
- Guards `/admin/*` routes: unauthenticated requests are redirected to `/admin/login`. The session cookie is verified using iron-session.
- Passes through `/admin/login` and all public routes without restriction.

### Pages & Layouts (`app/`)

- **Server components by default** — data fetching happens at render time with no client-side waterfalls.
- **Client components** are used only where interactivity is required (forms, carousels, the mobile menu).
- Pages call **services** directly (not repositories). They never access the database directly.
- API route handlers (`app/api/`) are thin: they validate input with Zod, call a service method, and return a JSON response.

### Feature Components (`features/`)

Scoped to a domain area (home, projects, about, contact, admin). Each feature directory contains only the components used by that domain — it does not own routing or data fetching logic; those live in `app/`.

### Services (`server/services/`)

The business logic layer. Each service:

- Accepts plain inputs (strings, objects).
- Returns `Result<T>` — a discriminated union that forces callers to handle both success and failure without exceptions escaping.
- Calls one or more repositories.
- Never knows about HTTP, sessions, or the database driver.

```ts
// Result<T> shape
type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

### Repositories (`server/repositories/`)

The data access layer. Repositories are **abstract classes** with typed method signatures. Concrete implementations (e.g. `PostgresProjectRepository`) are plugged in separately and implement the abstract methods against a real database.

```ts
abstract class ProjectRepository extends BaseRepository<Project, CreateProjectInput, UpdateProjectInput> {
  abstract findBySlug(slug: string): Promise<Project | null>;
  abstract getFeatured(): Promise<Project[]>;
}
```

This decouples business logic from the database driver, making the database swappable without touching services.

### Domain Entities (`server/domain/entities/`)

Plain TypeScript interfaces that describe the data shapes flowing through the system. They are the shared contract between repositories and services.

### Security (`server/security/`)

| Module | Responsibility |
|---|---|
| `crypto.ts` | `hashPassword` (scrypt + random salt) and `comparePassword` (timing-safe) |
| `csp.ts` | Builds the CSP header string from the per-request nonce; exports `securityHeaders` array |
| `rateLimit.ts` | In-memory per-IP rate limiter; `rateLimit(key, options)` returns `{ allowed, remaining, resetAt }` |
| `validation.ts` | Zod schemas for all API inputs; `sanitizeHtml` for output encoding |

### Auth (`server/auth/`)

| Module | Responsibility |
|---|---|
| `session.ts` | iron-session configuration: cookie name (`steban_session`), 8-hour TTL, HttpOnly + Secure + SameSite=Lax |
| `AuthService.ts` | `login(username, password, ip?)` verifies credentials against env vars and creates a session; `logout()` destroys it; `isAuthenticated()` checks the current session |

---

## Request Lifecycle

### Public page request

```
Browser → Next.js Middleware (proxy.ts)
            → Set CSP nonce + security headers
            → No auth check needed
          → Next.js Server Component renders
            → Calls service (e.g. ProjectService.getFeatured())
            → Service calls repository
            → Repository queries database
          → HTML streamed to browser
```

### Admin page request (authenticated)

```
Browser → Next.js Middleware (proxy.ts)
            → Set CSP nonce + security headers
            → Read iron-session cookie
            → Session valid → continue
          → Next.js Server Component renders admin page
```

### Admin page request (unauthenticated)

```
Browser → Next.js Middleware (proxy.ts)
            → Read iron-session cookie
            → Session missing or invalid
            → 302 redirect to /admin/login
```

### API route request (`POST /api/contact`)

```
Browser → Next.js Middleware (proxy.ts)
            → Apply security headers
          → API Route Handler (app/api/contact/route.ts)
            → Rate limit check (per IP, 5/hr)
            → Validate body with Zod contactFormSchema
            → Sanitize input fields
            → ContactService.create(input)
            → 200 { ok: true } or 4xx { error: string }
```

---

## Authentication Flow

```
POST /api/auth/login
  ├── Rate limit check (10 / 15 min per IP)
  ├── Validate body (adminLoginSchema)
  ├── AuthService.login(username, password, ip)
  │   ├── Compare username against ADMIN_USERNAME env var
  │   ├── comparePassword(password, ADMIN_PASSWORD_HASH) — timing-safe scrypt
  │   ├── On success → getSession() → session.isAdmin = true → session.save()
  │   └── On failure → log audit event → return { success: false, error }
  └── 200 { ok: true } or 401 { error: "Invalid credentials" }

POST /api/auth/logout
  └── getSession() → session.destroy()

Subsequent admin requests
  └── proxy.ts reads iron-session cookie → checks session.isAdmin === true
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP Request
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   proxy.ts (Middleware)                         │
│  • Injects CSP nonce                                            │
│  • Sets security headers                                        │
│  • Checks admin session for /admin/* routes                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
              ┌─────────────┼──────────────┐
              ▼             ▼              ▼
         Public Page    Admin Page     API Route
         (Server Comp.) (Server Comp.) (Route Handler)
              │             │              │
              └─────────────┼──────────────┘
                            │ calls
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Services                                   │
│  ProjectService / HeroService / ContactService / AuthService …  │
│  Returns Result<T>                                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │ calls
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Repositories (abstract)                      │
│  ProjectRepository / HeroRepository / ContactRepository …       │
└───────────────────────────┬─────────────────────────────────────┘
                            │ implemented by
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│          Concrete Implementations (to be added)                 │
│  PostgresProjectRepository / PostgresHeroRepository …           │
└───────────────────────────┬─────────────────────────────────────┘
                            │ queries
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Vercel Postgres                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Design Decisions

### App Router over Pages Router

Next.js App Router enables server components by default, which means data fetching happens at render time without client-side waterfalls. Layouts wrap route groups cleanly — the public and admin sections each have their own layout without a shared wrapping component.

### `Result<T>` over thrown exceptions

Services return `{ ok: true; value: T } | { ok: false; error: E }` instead of throwing. This forces every caller to handle both outcomes at compile time and avoids uncaught exceptions leaking through to HTTP responses.

### Abstract repositories

The repository layer is defined as abstract TypeScript classes. This means services depend on an interface, not a concrete driver. Swapping from Vercel Postgres to another database only requires adding a new concrete class — no service code changes.

### `proxy.ts` for security and auth guard

Putting CSP nonce generation and the admin auth check in Next.js middleware ensures these run on every matching request before any page code executes. There is no risk of accidentally forgetting the check in an individual page component.

### LESS with CSS Modules

Global design tokens live in `styles/variables.less`. Component-level styles use `.module.less` files for scoping, eliminating class name collisions without a CSS-in-JS runtime cost.

### iron-session over JWT

iron-session stores session state server-side (in an encrypted cookie) rather than in a client-readable JWT. This means session invalidation works immediately on the server without waiting for a JWT to expire.
