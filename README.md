# Stephen Abueva — Portfolio

Production-ready portfolio website for a Senior Software Engineer. Built with Next.js 16 (App Router), TypeScript, LESS, and Framer Motion. Deployed on Vercel.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styles | LESS (CSS Modules) |
| Animation | Framer Motion |
| Sessions | iron-session |
| Validation | Zod |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18.17+ (LTS recommended)
- npm 9+

### Installation

```bash
npm install
```

### Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

Required variables:

| Variable | Description |
|---|---|
| `SESSION_SECRET` | Min 32 random characters for iron-session encryption |
| `ADMIN_USERNAME` | Admin login username |
| `ADMIN_PASSWORD_HASH` | Hashed password — generate with the script below |
| `NEXT_PUBLIC_SITE_URL` | Full site URL without trailing slash |

#### Generate a password hash

```bash
node -e "
const { scryptSync, randomBytes } = require('crypto');
const password = 'YOUR_SECURE_PASSWORD';
const salt = randomBytes(16).toString('hex');
const hash = scryptSync(password, salt, 64).toString('hex');
console.log(salt + ':' + hash);
"
```

Paste the output as `ADMIN_PASSWORD_HASH`.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

### Other Scripts

```bash
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Format with Prettier
npm run type-check   # TypeScript strict check
```

---

## Folder Structure

```
app/
  (public)/          # Public pages: home, projects, about, contact
  admin/             # Auth-gated admin dashboard
  api/               # Route handlers (auth, contact)
components/layout/   # Shared Navbar, Footer, GoogleAnalytics
features/            # Feature-scoped UI components
  home/              # Hero, FeaturedCarousel
  projects/          # ProjectGrid
  about/             # AboutContent
  contact/           # ContactForm
  admin/             # Admin forms, sidebar
server/
  domain/entities/   # TypeScript entity types
  domain/types/      # Result<T>, Paginated<T>, helpers
  repositories/      # BaseRepository + abstract repo classes
  services/          # Business logic services
  auth/              # Session management (iron-session)
  security/          # CSP, rate limiting, crypto, validation
lib/                 # Structured data (JSON-LD)
config/              # site.ts, seo.ts, social.ts, analytics.ts
styles/              # LESS variables, mixins, global styles
types/               # Global TypeScript declarations (LESS modules)
tests/               # Unit + integration tests (to be filled)
docs/                # Architecture docs
proxy.ts             # Security proxy (CSP headers, admin auth guard)
```

---

## Admin Dashboard

Visit `/admin` to access the content management dashboard.

Default route: `/admin/login`

The dashboard lets you edit:
- **Hero** — name, title, introduction, photo, resume link
- **About** — biography, skills, experience, education, certifications
- **Projects** — full CRUD (title, slug, description, gallery, tech, links)
- **Featured** — choose which projects appear in the home carousel
- **Contact Info** — email, social links, resume URL
- **SEO** — per-page metadata, OG image, noindex
- **Analytics** — GA4 configuration status
- **Social Links** — GitHub, LinkedIn, Facebook
- **Footer** — legal link URLs
- **Messages** — view contact form submissions

> **Note:** Admin editors are fully wired UI. To persist data, connect the service layer to Vercel Postgres (see Database section below).

---

## Database (Vercel Postgres)

The architecture is database-ready. The service and repository layers are implemented — concrete implementations need to be added:

1. Add the Vercel Postgres integration in your Vercel project dashboard
2. Create tables using the schemas implied by the entity types in `server/domain/entities/`
3. Implement concrete repository classes (e.g. `PostgresProjectRepository extends ProjectRepository`)
4. Wire the concrete implementations into the API route handlers and Server Actions

---

## SEO

- Next.js Metadata API on every page
- Open Graph + Twitter Cards
- JSON-LD structured data (Person + WebSite schemas) on home page
- `sitemap.xml` — auto-generated, extend with dynamic project slugs
- `robots.txt` — disallows `/admin/` and `/api/`
- Canonical URLs on every page
- Semantic HTML, correct heading hierarchy

---

## Security

OWASP ASVS Level 2 target. Measures in place:

- **CSP** — per-request nonce, strict directives, no `unsafe-inline` for scripts
- **Security headers** — HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **Sessions** — iron-session; HttpOnly, Secure, SameSite=Lax cookies; 8h TTL
- **Authentication** — scrypt password hashing, timing-safe compare
- **Rate limiting** — per-IP limits on login (10/15min) and contact form (5/hr)
- **Input validation** — Zod schemas at every API boundary
- **Output encoding** — HTML entity escaping before persistence
- **Admin route guard** — proxy-level redirect to login for unauthenticated requests

---

## Analytics

Google Analytics 4 fires automatically in production when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set. Disabled in development. All analytics config lives in `config/analytics.ts`.

---

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Set all environment variables (see `.env.local.example`)
4. Add Vercel Postgres + Vercel Blob integrations
5. Deploy

Preview deployments are created automatically for every push.

---

## License

All Rights Reserved. © Stephen Abueva.
