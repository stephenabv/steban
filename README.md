# Stephen Abueva — Portfolio

Production-ready personal portfolio website for a Senior Software Engineer. Built with Next.js 16 (App Router), TypeScript, LESS, and Framer Motion. Deployed on Vercel.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Admin Dashboard](#admin-dashboard)
- [Database](#database)
- [SEO](#seo)
- [Security](#security)
- [Analytics](#analytics)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [License](#license)

---

## Overview

This site serves two audiences:

**Public visitors** see a polished portfolio with:
- Hero section with animated introduction
- Featured projects carousel (auto-rotating)
- Full project gallery with individual detail pages
- About section (skills, experience, education, certifications)
- Contact form with server-side validation and rate limiting
- Privacy policy and terms of service

**The owner** gets a private admin dashboard at `/admin` for managing all content:
- Edit every section of the site without touching code
- Manage projects (create, read, update, delete)
- View incoming contact form messages
- Configure SEO per page
- Manage social links and footer

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict mode) |
| UI | React 19 |
| Styles | LESS + CSS Modules |
| Animation | Framer Motion |
| Sessions | iron-session (HttpOnly cookies) |
| Validation | Zod |
| Password hashing | Node.js `crypto.scryptSync` |
| Deployment | Vercel |
| Analytics | Google Analytics 4 |

---

## Quick Start

### Prerequisites

- Node.js 18.17 or later (LTS recommended)
- npm 9 or later

### Install

```bash
npm install
```

### Configure environment

```bash
cp .env.local.example .env.local
```

Fill in the required variables (see [Environment Variables](#environment-variables)).

### Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Other commands

```bash
npm run build        # Production build
npm start            # Run production server
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Format all files with Prettier
npm run type-check   # TypeScript strict check (no emit)
```

---

## Environment Variables

### Required

| Variable | Description |
|---|---|
| `SESSION_SECRET` | Min 32 random characters — used by iron-session to encrypt session cookies |
| `ADMIN_USERNAME` | Username for the admin login |
| `ADMIN_PASSWORD_HASH` | Hashed admin password in `salt:hash` format (see below) |
| `NEXT_PUBLIC_SITE_URL` | Full public URL of the site, no trailing slash (e.g. `https://stephenabueva.com`) |

#### Generating a password hash

```bash
node -e "
const { scryptSync, randomBytes } = require('crypto');
const password = 'YOUR_SECURE_PASSWORD';
const salt = randomBytes(16).toString('hex');
const hash = scryptSync(password, salt, 64).toString('hex');
console.log(salt + ':' + hash);
"
```

Copy the printed output and set it as `ADMIN_PASSWORD_HASH`.

### Optional

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 Measurement ID (e.g. `G-XXXXXXXXXX`) |

### Vercel integrations (auto-set)

These are injected automatically when the corresponding Vercel integrations are added to the project:

| Variable | Integration |
|---|---|
| `POSTGRES_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_DATABASE` | Vercel Postgres |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob |
| `KV_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`, `KV_REST_API_URL` | Vercel KV |

---

## Project Structure

```
steban/
├── app/                        # Next.js App Router
│   ├── (public)/               # Route group — public-facing pages
│   │   ├── layout.tsx          # Public layout (Navbar + Footer)
│   │   ├── page.tsx            # Home page
│   │   ├── about/              # /about
│   │   ├── contact/            # /contact
│   │   ├── projects/           # /projects
│   │   │   └── [slug]/         # /projects/:slug (dynamic)
│   │   ├── privacy/            # /privacy
│   │   └── terms/              # /terms
│   ├── admin/                  # Auth-gated admin dashboard
│   │   ├── layout.tsx          # Admin layout (AdminSidebar + main)
│   │   ├── page.tsx            # Dashboard overview
│   │   ├── login/              # /admin/login
│   │   ├── hero/               # Edit hero section
│   │   ├── about/              # Edit about section
│   │   ├── projects/           # Manage projects (CRUD)
│   │   ├── featured/           # Curate featured carousel
│   │   ├── contact-info/       # Edit contact information
│   │   ├── seo/                # Per-page SEO metadata
│   │   ├── messages/           # View contact submissions
│   │   ├── analytics/          # Analytics configuration
│   │   ├── social/             # Social media links
│   │   └── footer/             # Footer link management
│   ├── api/                    # API route handlers
│   │   ├── auth/login/         # POST /api/auth/login
│   │   ├── auth/logout/        # POST /api/auth/logout
│   │   └── contact/            # POST /api/contact
│   ├── layout.tsx              # Root layout (fonts, metadata, GA)
│   ├── not-found.tsx           # 404 page
│   ├── robots.ts               # Auto-generated robots.txt
│   └── sitemap.ts              # Auto-generated sitemap.xml
│
├── components/layout/          # Shared layout components
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── GoogleAnalytics.tsx
│
├── features/                   # Feature-scoped UI components
│   ├── home/                   # HeroSection, FeaturedCarousel
│   ├── projects/               # ProjectGrid
│   ├── about/                  # AboutContent
│   ├── contact/                # ContactForm
│   └── admin/                  # AdminSidebar, AdminLoginForm
│
├── server/                     # Backend — never imported by client code
│   ├── domain/
│   │   ├── entities/           # TypeScript data models
│   │   └── types/              # Result<T>, Paginated<T>, helpers
│   ├── repositories/           # Abstract data access layer
│   ├── services/               # Business logic
│   ├── auth/                   # iron-session setup, AuthService
│   └── security/               # CSP, rate limiting, crypto, Zod schemas
│
├── config/                     # Static site configuration
│   ├── site.ts                 # Site name, author, URL
│   ├── seo.ts                  # Default OG/Twitter metadata
│   ├── social.ts               # Social media links
│   └── analytics.ts            # GA4 configuration
│
├── lib/                        # Pure utility functions
│   └── structuredData.ts       # JSON-LD schema generators
│
├── styles/                     # Global LESS
│   ├── globals.less            # Reset + base typography
│   ├── variables.less          # Design tokens
│   └── mixins.less             # Reusable LESS mixins
│
├── types/                      # Global TypeScript declarations
├── docs/                       # Architecture and API documentation
├── proxy.ts                    # Next.js middleware (CSP, admin auth guard)
├── next.config.ts              # Next.js configuration
└── tsconfig.json               # TypeScript configuration
```

---

## Admin Dashboard

Navigate to `/admin` (redirects to `/admin/login` when not authenticated).

### Sections

| Section | Route | What you can edit |
|---|---|---|
| Dashboard | `/admin` | Live counts (projects, featured, messages, unread) + recent activity |
| Hero | `/admin/hero` | Name, title, introduction, profile photo |
| Resume | `/admin/resume` | Upload, view, download and replace the resume PDF served at `/resume.pdf` |
| About | `/admin/about` | Biography, skills, experience, education, certifications |
| Projects | `/admin/projects` | Create, edit, delete projects |
| Featured | `/admin/featured` | Choose which projects appear in the home carousel and their order |
| Contact Info | `/admin/contact-info` | Email, phone, social links |
| SEO | `/admin/seo` | Per-page title, description, OG image, noindex flag |
| Analytics | `/admin/analytics` | View GA4 configuration status |
| Social Links | `/admin/social` | GitHub, LinkedIn, Facebook URLs |
| Footer | `/admin/footer` | Footer link URLs (privacy, terms) |
| Messages | `/admin/messages` | Read and manage contact form submissions |

> **Note:** All admin UI is complete. Data persistence requires connecting the service layer to a database — see [Database](#database).

---

## Database

The architecture is database-ready. Services and abstract repositories are implemented; only concrete implementations against a real database are needed.

### Steps to add Vercel Postgres

1. In your Vercel project dashboard, add the **Postgres** integration — this auto-sets all `POSTGRES_*` environment variables.
2. Create tables based on the entity types in [server/domain/entities/](server/domain/entities/).
3. Implement concrete repository classes:
   ```ts
   // Example
   class PostgresProjectRepository extends ProjectRepository {
     async findById(id: string) { /* query Vercel Postgres */ }
     // ...
   }
   ```
4. Wire the concrete repositories into services in `server/services/`.

See [docs/DATABASE.md](docs/DATABASE.md) for full schema reference.

---

## SEO

- **Metadata API** — Every page uses Next.js `generateMetadata` for title, description, canonical URL, OG, and Twitter card.
- **JSON-LD** — Home page outputs `Person` + `WebSite` structured data schemas.
- **Sitemap** — Auto-generated at `/sitemap.xml`. Extend `app/sitemap.ts` with dynamic project slugs once the database is connected.
- **Robots** — Auto-generated at `/robots.txt`. Blocks `/admin/` and `/api/`.
- **Semantic HTML** — Correct heading hierarchy, landmark elements, and `alt` text throughout.

---

## Security

Target: OWASP ASVS Level 2.

| Measure | Implementation |
|---|---|
| Content Security Policy | Per-request nonce injected in `proxy.ts`; strict directives, no `unsafe-inline` on scripts |
| Security headers | HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| Session management | iron-session — HttpOnly, Secure, SameSite=Lax cookie; 8-hour TTL |
| Password hashing | `crypto.scryptSync` with random 16-byte salt; timing-safe compare |
| Rate limiting | Per-IP limits: admin login (10 / 15 min), contact form (5 / hr), general API (60 / min) |
| Input validation | Zod schemas at every API boundary |
| Output encoding | HTML entity escaping before any persistence |
| Admin route guard | Middleware-level redirect for unauthenticated `/admin/*` requests |

See [docs/SECURITY.md](docs/SECURITY.md) for full details.

---

## Analytics

Google Analytics 4 fires automatically **in production only** when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set. It is disabled in development. All configuration lives in [`config/analytics.ts`](config/analytics.ts) and the `GoogleAnalytics` component is loaded via `next/script` with the `afterInteractive` strategy.

---

## Deployment

### Vercel (recommended)

1. Push the repository to GitHub.
2. Import the repo in the [Vercel dashboard](https://vercel.com/new).
3. Set all required environment variables under **Settings → Environment Variables**.
4. (Optional) Add **Vercel Postgres** and **Vercel Blob** integrations.
5. Click **Deploy**.

Preview deployments are created automatically for every branch push.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for a step-by-step production checklist.

---

## Documentation

| Document | Description |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, data flow, layer responsibilities |
| [docs/API.md](docs/API.md) | Complete API endpoint reference |
| [docs/COMPONENTS.md](docs/COMPONENTS.md) | Component and feature module reference |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Design tokens, UI primitives and interaction patterns |
| [docs/UI_REDESIGN.md](docs/UI_REDESIGN.md) | 2026-09 UI/UX redesign: findings, plan and outcomes |
| [docs/DATABASE.md](docs/DATABASE.md) | Entity schemas and database integration guide |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Full production deployment checklist |
| [docs/SECURITY.md](docs/SECURITY.md) | Security architecture deep-dive |

---

## License

All Rights Reserved. © Stephen Abueva.
