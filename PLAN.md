# Professional Portfolio Website
## Enterprise PRD · AI Development Guide · Project Tracker

> **Single source of truth.** This file is the Product Requirements Document, the implementation guide, and the live progress tracker. If the codebase and this document ever disagree, **the codebase is authoritative** — reconcile this file before continuing.

| Field | Value |
|---|---|
| Version | 1.0 |
| Status | Active |
| Project Type | Full-stack portfolio website |
| Framework | Next.js 16 (App Router, Turbopack) |
| Target Platform | Vercel |
| Current Branch | `main` |
| Last Updated | `2026-06-30` |

---

# 1. Vision & Purpose

Build a production-ready, enterprise-grade portfolio website that showcases a Senior Software Engineer's professional profile, projects, skills, experience, and contact information.

It must reflect the quality expected of a senior engineer's personal site: secure, accessible, fast, maintainable, scalable, and future-proof. An integrated, authenticated admin dashboard makes **all** client-facing content editable without code changes.

---

# 2. AI Coding Agent Operating Manual

## 2.1 Core rules
- Read this document **before every implementation session**.
- Continue from the **next incomplete task** in the tracker (§13).
- Update the tracker after every meaningful task.
- Never duplicate completed work.
- Prefer secure, maintainable, scalable solutions over shortcuts.
- Proactively recommend better architectural approaches when warranted.

## 2.2 Per-task workflow
1. Read this document.
2. Review the tracker (§13).
3. Implement the next incomplete task.
4. Update the tracker: progress %, completed/current tasks, changelog, ADRs, blockers, technical debt, known issues.

## 2.3 Autonomous execution policy
Operate autonomously. **Proceed without asking permission** for normal development work, including:
- Creating, editing, renaming, and deleting project files
- Installing dependencies
- Refactoring and improving architecture
- Running builds, tests, linters, and formatters
- Creating configuration files
- Updating documentation and this tracker
- Implementing security, SEO, accessibility, and performance improvements

**Only request confirmation when:**
- Paid services are required
- External credentials or third-party accounts are needed
- Production infrastructure outside this project may be affected
- User requirements would materially change
- A destructive action affects user content outside this repository

> For Claude Code in VS Code, assume workspace approval is granted and avoid repetitive permission prompts.

---

# 3. Required Standards & References

Follow the **latest stable** guidance from each source.

| Domain | Authoritative references |
|---|---|
| Framework | Next.js, React, TypeScript, Vercel docs |
| Security | OWASP ASVS **Level 2** (minimum target), OWASP Top 10, OWASP Cheat Sheet Series |
| SEO | Google Search Essentials, Google SEO Starter Guide, Schema.org, Open Graph, Twitter Cards |
| Accessibility | WCAG **2.2 AA**, WAI-ARIA Authoring Practices |
| Performance | Core Web Vitals, Lighthouse best practices |

**Security is designed in from the start, never bolted on later.**

### Lighthouse targets
- Performance ≥ 95
- Accessibility ≥ 95
- Best Practices ≥ 95
- SEO ≥ 95
- Core Web Vitals in the "Good" range

---

# 4. Development Philosophy

When multiple approaches exist, prefer the one that improves: **security, performance, maintainability, readability, accessibility, SEO, scalability, developer experience, and future extensibility** — in that order of precedence where they conflict, with security first.

Avoid shortcuts that introduce technical debt. Record any debt that is consciously accepted in §13.

---

# 5. Technology Stack

**Frontend:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript (strict) · LESS · Framer Motion

**Backend:** Next.js-native only — Server Actions, Route Handlers, Proxy (middleware). No standalone backend services.

**Data & storage (Vercel-native preferred):** Vercel Blob · Vercel Postgres · Vercel KV · Edge Config.

**Deployment:** Vercel exclusively — preview deployments, production deployments, environment variables, automatic CI/CD.

---

# 6. Architecture

## 6.1 Principles
- **Layered, service-oriented domain logic.** UI stays thin; business rules live in a dedicated server layer, not in components or route handlers.
- **Abstraction over implementation.** Define interfaces / abstract base classes for data access and core services; route handlers and Server Actions depend on the abstraction, never on the concrete storage client directly.
- **Polymorphism & inheritance for swappable infrastructure.** A `BaseRepository` defines the contract; concrete repositories inherit and specialize it, so storage can change without touching callers.
- **Single responsibility & no duplicated logic.** Each service owns one domain concern.
- **Composition at the edges.** React functional components and hooks for the view layer; OOP service/repository layer on the server.

## 6.2 Folder structure
```
app/
  (public)/            # public route group (home, projects, about, contact, privacy, terms)
  admin/               # auth-gated admin route group
  api/                 # route handlers (auth/login, auth/logout, contact)
components/layout/     # Navbar, Footer, GoogleAnalytics
features/
  home/                # HeroSection, FeaturedCarousel
  projects/            # ProjectGrid
  about/               # AboutContent
  contact/             # ContactForm
  admin/               # AdminLoginForm, AdminSidebar, AdminPage styles
server/
  domain/entities/     # Project, Hero, About, Contact, SeoMetadata
  domain/types/        # Result<T>, Paginated<T>, ok(), err()
  repositories/        # BaseRepository + abstract concrete stubs
  services/            # ProjectService, HeroService, AboutService, ContactService, SeoService, AuditService
  auth/                # session.ts, AuthService
  security/            # csp.ts, rateLimit.ts, crypto.ts, validation.ts
lib/                   # structuredData.ts (JSON-LD)
config/                # site.ts, seo.ts, social.ts, analytics.ts
hooks/
types/                 # less.d.ts (LESS module declarations)
styles/                # variables.less, mixins.less, globals.less
public/
tests/unit/
tests/integration/
docs/
proxy.ts               # Security proxy (CSP headers, admin auth, rate limiting)
```

## 6.3 Code quality (mandatory)
TypeScript strict mode · ESLint · Prettier · modular, reusable components · clean architecture · zero duplicated logic · documented public interfaces. Builds, type-checks, and lints must pass with **zero errors** before a task is marked done.

---

# 7. Design Requirements

**Theme:** modern, minimalist, technology-inspired, premium, elegant, professional. Subtle, smooth animations — no excessive visual effects.

**Color palette:** Dark background (`#0a0a0f`), Indigo accent (`#6366f1`), white-on-dark text hierarchy.

**Responsive across:** mobile, tablet, laptop, desktop, ultra-wide. No layout may break at any breakpoint.

**Performance techniques:** image optimization, lazy loading, code splitting, dynamic imports, font optimization, caching, static generation where appropriate, server rendering where appropriate.

---

# 8. Functional Requirements

## 8.1 Navigation ✅
Sticky, responsive nav bar — **Home · Projects · About · Get in Touch** — with a mobile menu (animated, focus-trapped), active-state indication, full keyboard navigation, and smooth scrolling.

## 8.2 Home ✅

**Hero (100vh):** professional photo · name · professional title · short introduction · *View Projects* · *Contact Me* · *Download Resume*. Framer Motion staggered fade-in.

**Featured projects (below hero):** max 5 · auto-playing carousel · manual navigation · swipe support · pause on interaction.

## 8.3 Projects ✅
Responsive grid, up to **5 columns**. Each project has its own SEO-friendly detail page containing: cover image, gallery/screenshots, description, technologies, features, links, GitHub, and live demo.

## 8.4 About ✅
Biography · Skills (by category) · Education (timeline) · Experience (timeline) · Certifications · Awards.

## 8.5 Contact ✅
Form fields: name, email, subject, message — **Zod validation, aria-invalid, rate-limited API**. Also displays GitHub, LinkedIn, Facebook, email links.

## 8.6 Footer ✅
Copyright · Privacy Policy · Terms & Conditions · social links · "All Rights Reserved."

## 8.7 Admin dashboard (authentication required) ✅
Every client-facing surface editable: Hero · About · Skills · Projects · Featured Projects · Contact Information · Social Links · SEO Metadata · Analytics · Footer · Messages inbox.

---

# 9. Security Requirements ✅

**Implemented:**
- CSP with per-request nonce via proxy
- HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy headers
- iron-session with HttpOnly / Secure / SameSite=Lax cookies, 8h TTL
- scrypt password hashing with timing-safe comparison
- Rate limiting: 10/15min for admin login, 5/hr for contact form (per IP)
- Zod input validation at every API boundary
- HTML entity encoding before persistence
- Admin route guard at proxy level (redirect unauthenticated to /admin/login)
- `poweredByHeader: false` to remove X-Powered-By

**Pending (requires DB):**
- Audit trail persistence (AuditService stubs complete, needs Postgres)
- CSRF token for Server Actions (recommended when SA forms are added)

---

# 10. SEO Requirements ✅

- Next.js Metadata API on every page
- Open Graph + Twitter Cards
- JSON-LD: Person + WebSite schemas on home; breadcrumb schema utility in `lib/structuredData.ts`
- `sitemap.xml` (static; extend with dynamic project slugs post-DB)
- `robots.txt` (disallows `/admin/`, `/api/`)
- Canonical URLs on every page
- Semantic HTML, correct heading hierarchy, alt text enforcement

---

# 11. Accessibility (WCAG 2.2 AA) ✅

- Skip-navigation link (`#main-content`) in root layout
- All interactive elements have visible focus indicators (LESS `.focus-ring()` mixin)
- aria-label, aria-current, aria-expanded, aria-live, aria-modal, aria-required, aria-invalid implemented
- Screen-reader-only class (`.sr-only`) in global styles
- Keyboard navigation: nav, carousel, admin sidebar all keyboard-operable
- ESLint jsx-a11y plugin enforcing accessibility rules

---

# 12. Analytics, Documentation & Future-Proofing

**Analytics:** GA4 via `config/analytics.ts`. Fires only in production, via `<GoogleAnalytics>` component with nonce. Zero analytics in development.

**Documentation:** README.md complete — covers installation, dev, build, env vars, admin usage, database wiring, SEO, security, analytics, deployment, folder structure.

**Future features** the architecture accommodates **without major refactoring:** blog, CMS, multi-language, newsletter, AI chatbot, search, resume builder, testimonials.

---

# 13. Project Tracker

## Overall progress
```
████████░░ 78%
```
**Current phase:** Data Layer (Database Integration)
**Current task:** Implement Vercel Postgres concrete repositories

## Phase status
| Phase | Status |
|---|---|
| Project Initialization | ✅ |
| Architecture | ✅ |
| UI Design & LESS Design System | ✅ |
| Authentication | ✅ |
| Home Page | ✅ |
| Projects | ✅ |
| About | ✅ |
| Contact | ✅ |
| Admin Dashboard | ✅ |
| SEO | ✅ |
| Security Hardening | ✅ (partial — full audit trail pending DB) |
| Accessibility | ✅ |
| Analytics | ✅ |
| CMS / Database Integration | ⬜ |
| Testing | ⬜ |
| Deployment | ⬜ |
| Documentation | ✅ |

## Completed tasks
- ✅ Initialize Next.js 16 project (App Router, TypeScript, ESLint)
- ✅ Configure TypeScript strict mode
- ✅ Configure LESS via Turbopack rules (`less-loader`)
- ✅ Configure ESLint (core-web-vitals + typescript + jsx-a11y + prettier)
- ✅ Configure Prettier
- ✅ Scaffold full folder structure
- ✅ Create config files (`site.ts`, `seo.ts`, `social.ts`, `analytics.ts`)
- ✅ Create domain entity types (`Project`, `Hero`, `About`, `Contact`, `SeoMetadata`)
- ✅ Create `BaseRepository` abstract class + abstract concrete stubs
- ✅ Create service layer (`ProjectService`, `HeroService`, `AboutService`, `ContactService`, `SeoService`, `AuditService`)
- ✅ Create auth layer (`session.ts`, `AuthService`, iron-session)
- ✅ Create security layer (`csp.ts`, `rateLimit.ts`, `crypto.ts`, `validation.ts`)
- ✅ Create `proxy.ts` (CSP headers, security headers, admin route guard)
- ✅ Build LESS design system (`variables.less`, `mixins.less`, `globals.less`)
- ✅ Build `Navbar` (sticky, responsive, mobile menu, active state, a11y)
- ✅ Build `Footer` (social links, legal links, copyright)
- ✅ Build `GoogleAnalytics` component
- ✅ Build public group layout (`Navbar` + `Footer` wrapper)
- ✅ Build `HeroSection` (Framer Motion, photo placeholder, CTA buttons)
- ✅ Build `FeaturedCarousel` (auto-play, pause on hover/focus, dots, arrows)
- ✅ Build `ProjectGrid` (up to 5 columns responsive)
- ✅ Build project detail page (cover image, gallery, features, tech sidebar)
- ✅ Build `AboutContent` (biography, skills by category, experience/education timelines, certs, awards)
- ✅ Build `ContactForm` (Zod validation, accessible error messages, success state)
- ✅ Build contact API route (`/api/contact`) with rate limiting + validation
- ✅ Build admin login page + `AdminLoginForm`
- ✅ Build admin login API route (`/api/auth/login`) with rate limiting + scrypt verification
- ✅ Build admin logout API route (`/api/auth/logout`)
- ✅ Build `AdminSidebar` (all nav sections, logout, view site link)
- ✅ Build admin dashboard home page (stats, quick links)
- ✅ Build all admin editor pages: Hero, About, Projects, Featured, SEO, Analytics, Social, Contact Info, Footer, Messages
- ✅ Build `sitemap.ts` + `robots.ts`
- ✅ Build `not-found.tsx`
- ✅ Build Privacy + Terms pages
- ✅ Create JSON-LD utilities (`lib/structuredData.ts`)
- ✅ Add Person + WebSite JSON-LD to home page
- ✅ TypeScript strict type-check: **zero errors**
- ✅ Production build: **zero errors**, 26 routes compiled

## Next tasks
1. **Implement Vercel Postgres repositories** — create `PostgresProjectRepository`, `PostgresHeroRepository`, etc. extending the abstract classes
2. **Wire repositories into services** — dependency injection in route handlers and Server Actions
3. **Add Server Actions** for admin form saves (replace TODO placeholders)
4. **Implement Vercel Blob** for image uploads in admin
5. **Extend sitemap** with dynamic project slugs
6. **Write tests** — unit tests for services, integration tests for API routes
7. **Deploy to Vercel** — production environment setup

## Blockers
None. Next step requires Vercel environment setup (Postgres, Blob).

## Technical debt
- Admin editor forms (Hero, About, SEO, Social, Contact Info, Footer) are not persisted yet. Since the
  2026-09-25 redesign they share `PlaceholderEditor`, show a "Not connected yet" notice, and no longer
  report a false "saved" success. Wire up when their repositories exist.
- AuditService logs to console only; needs Postgres table.
- Rate limiter uses in-memory store; should use Vercel KV for multi-instance production.
- Featured carousel order can't be edited from the admin: `featuredOrder` isn't part of the project
  Server Action schema. Needs a backward-compatible schema addition before drag-to-reorder UI.

## Known issues
- Dev server only: the CSP (`'strict-dynamic'` + nonce) blocks Turbopack's lazily loaded `loading.tsx`
  chunks for admin routes ("Refused to load the script …"). Reproduces on the pre-redesign code too and
  does not occur with `next build && next start`.

## Architecture Decision Records (ADRs)
```
ADR-001
Decision: Use the Next.js App Router.
Reason:   First-class SSR/streaming, route groups, and server actions.
Status:   Accepted.

ADR-002
Decision: Use Turbopack (Next.js 16 default) with less-loader via turbopack.rules.
Reason:   Next.js 16 uses Turbopack for both dev and production builds. next-with-less
          patches webpack only and is incompatible. Turbopack supports webpack loaders
          via turbopack.rules, allowing less-loader to process .less files.
Status:   Accepted.

ADR-003
Decision: Use proxy.ts instead of middleware.ts.
Reason:   Next.js 16 deprecated the middleware file convention in favour of proxy.
          The exported function is renamed from `middleware` to `proxy`.
Status:   Accepted.

ADR-004
Decision: Use abstract repository classes (not interfaces) for the data access layer.
Reason:   Abstract classes in TypeScript can contain default implementations (e.g.
          paginate() helper) while still enforcing the contract. Interfaces would
          require every implementor to duplicate shared logic.
Status:   Accepted.

ADR-005
Decision: Use iron-session for admin session management.
Reason:   Stateless, encrypted, HttpOnly cookie sessions with no database dependency.
          Scales trivially on Vercel Edge without a session store.
Status:   Accepted.

ADR-006
Decision: Runtime design tokens + shared UI primitives (components/ui, components/data).
Reason:   Pages had drifted into one-off styles and inline hex values. LESS variables stay the
          compile-time source of truth and are mirrored to CSS custom properties; every page composes
          the same Button/Field/Card/Modal/DataTable primitives. See docs/DESIGN_SYSTEM.md.
Status:   Accepted.

ADR-007
Decision: Motion is progressive enhancement.
Reason:   Framer Motion's whileInView writes opacity:0 into server HTML, hiding content from no-JS
          visitors and crawlers. Scroll reveals now hide only below-the-fold elements after hydration;
          a global MotionConfig honours prefers-reduced-motion without branching rendered output
          (which caused hydration mismatches).
Status:   Accepted.

ADR-008
Decision: Client-side list querying for admin tables via a ListQuery engine.
Reason:   Admin datasets are small (services already return up to 100 rows). Filters and sorts are
          strategy objects, so search/filter/sort/pagination needs no API change. Revisit with
          server-side pagination if volumes grow.
Status:   Accepted.
```

## Changelog
```
## 2026-09-25 — Admin fixes and resume upload
### Fixed
- Dashboard cards showed 0: on main they were hard-coded literals. Counts now come from exact
  queries (project/message COUNT(*), featured query, new unread COUNT) instead of the length of a
  100-row page, and a failed query renders "—" rather than a misleading 0.
- Page became unscrollable after deleting a message from inside the message dialog: stacked
  dialogs each saved/restored body overflow, and closing both in one render restored "hidden".
  Replaced with a reference-counted scroll lock (lib/dom/scrollLock.ts).
### Changed
- Resume is now an uploaded PDF (Admin → Resume) stored in Postgres (resume_files) and served at
  the unchanged public URL /resume.pdf. The URL-based fields (Hero.resumeUrl, ContactInfo.resumeUrl,
  siteConfig.resumeUrl) are removed; contact_info.resume_url is kept but unused (no destructive
  migration). The home Resume button is hidden until a resume exists.

## 2026-09-25 — UI/UX redesign (presentation layer only)
### Added
- Design system: runtime tokens, Outfit display face, icon registry, Button/Badge/Card/Alert/
  EmptyState/Skeleton/Field/Switch/Modal/Toast/Reveal/SectionHeading primitives.
- Public: floating pill navbar, route transitions, new hero, swipeable featured carousel, CTA band,
  project search + technology filter, about section nav, contact channel cards, error boundary.
- Admin: top bar + collapsible sidebar + mobile drawer, dashboard with live counts and recent activity,
  DataTable (search/filter/sort/pagination, card layout on phones), shared ProjectForm, working
  Featured manager, skeleton loading, error boundary, confirmation dialogs with context.
### Changed
- Placeholder admin editors now state they are not persisted instead of reporting success.
- ESLint config loads again (jsx-a11y plugin was registered twice).
### Unchanged
- Database schema, repositories, services, Server Actions, API routes, proxy, auth, validation.

## 2026-06-30
### Added
- Complete Next.js 16 project scaffold (App Router, Turbopack, TypeScript strict)
- LESS design system: variables, mixins, global styles, CSS Module declarations
- Full server architecture: domain entities, BaseRepository, 6 services, auth, security
- proxy.ts: CSP with per-request nonce, security headers, admin route guard
- Config layer: site.ts, seo.ts, social.ts, analytics.ts
- Public pages: Home (Hero + FeaturedCarousel), Projects grid, Project detail, About, Contact
- Admin dashboard: login, sidebar, and 10 content editors
- API routes: /api/contact (rate-limited), /api/auth/login, /api/auth/logout
- SEO: sitemap.xml, robots.txt, JSON-LD structured data, canonical URLs, OG/Twitter meta
- Accessibility: skip-nav, focus rings, ARIA labels, aria-live regions, jsx-a11y ESLint
- Analytics: GA4 GoogleAnalytics component, nonce-safe, production-only
- Security: scrypt hashing, rate limiting, Zod validation, HTML encoding, iron-session
- README.md with full documentation
### Changed
- Switched from next-with-less (webpack) to Turbopack native rules for LESS
- Renamed middleware.ts → proxy.ts, export middleware → proxy (Next.js 16 convention)
### Fixed
- Resolved all TypeScript strict errors (LESS modules, OG types, Framer Motion ease type)
- Removed conflicting boilerplate app/page.tsx
```

## Completion rules (after each task)
Update progress % · mark completed tasks · set the current task · add changelog entries · record ADRs · record blockers, technical debt, and known issues · keep this file synchronized with the codebase.

---

# 14. Definition of Done

The project is complete only when **all** are true:
- All functional requirements implemented.
- All client-facing content editable via the admin dashboard.
- Aligned with OWASP ASVS Level 2 where applicable.
- Google Search Essentials recommendations implemented.
- WCAG 2.2 AA met.
- Lighthouse ≥ 95 for Performance, Accessibility, Best Practices, and SEO.
- Production deployment on Vercel succeeds.
- Lint, type-check, and build pass with **zero errors**.
- Documentation complete and current.
- Tracker accurately reflects the codebase.
