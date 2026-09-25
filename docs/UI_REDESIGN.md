# UI/UX Redesign — Architecture Findings & Implementation Plan

> Scope: presentation layer only. Backend architecture, database schema, API contracts,
> Server Actions, authentication, authorization and validation rules are **unchanged**.
> Design reference: `stephenabv/azari-client` (the source of https://azari.solar), used read-only.

---

## 1. Existing architecture (as discovered)

| Layer | Location | Notes |
|---|---|---|
| Routing | `app/(public)/*`, `app/admin/*`, `app/api/*` | Next.js 16 App Router. Public route group with `Navbar` + `Footer` layout; admin split into `login` and an auth-gated `(dashboard)` group. |
| Edge/proxy | `proxy.ts` | Per-request CSP nonce, security headers, admin route guard, secret admin path (`sudo_route`) rewritten to `/admin/*`. |
| Auth | `server/auth/*`, `app/api/auth/*` | iron-session cookie (`steban_session`), scrypt password check, login rate limit. Dashboard layout re-checks the session (defense in depth). |
| Server Actions | `features/admin/projectActions.ts`, `messageActions.ts` | Each action re-verifies `session.isAdmin`, validates with Zod, calls a service, then `revalidatePath`. |
| Services | `server/services/*` | `ProjectService`, `ContactService`, … return `Result<T>` (`ok`/`err`). Singletons via `get*Service()`. |
| Repositories | `server/repositories/*` | Abstract `BaseRepository` → abstract `ProjectRepository` / `ContactMessageRepository` → Postgres or JSON implementations (polymorphic storage). |
| Data | Postgres (`server/db/pool.ts`) with JSON fallback | Entities: `Project`, `ContactMessage`, `ContactInfo`, `Hero`, `About`, `SeoMetadata`. |
| Public API | `POST /api/contact` | Zod-validated, rate-limited contact submissions. |
| Styling | LESS + CSS Modules | Tokens in `styles/variables.less`, mixins in `styles/mixins.less`. |
| Motion | Framer Motion | Hero stagger, carousel slides, mobile menu. |

**Data flow.** Server Components read through services (`getProjectService().getAll()`),
serialize to plain DTOs and hand them to Client Components. Mutations go through Server
Actions, which return `{ ok, error? }` and trigger `router.refresh()` on the client.

## 2. UI/UX problems identified

**Design system**
- Tokens exist only as LESS compile-time variables; no runtime CSS variables, no display font,
  no motion tokens. Many one-off inline `style={{…}}` blocks with hard-coded hex values
  (`privacy`, `terms`, `not-found`, admin pages).
- Buttons, badges, inputs and empty states are re-implemented per page with drifting styles.
- Social/brand SVG icons are copy-pasted in 3+ places.

**Public site**
- Navbar is a plain full-width bar; active state is underline-only and the mobile menu is a
  full-screen overlay without an Escape handler.
- No page transitions; no scroll-reveal; no error boundary UI (`error.tsx`) for data failures.
- The featured carousel claims swipe support but has no drag handling.
- Project cards only link via a small "View Details" text link (small target).
- No way to search or filter projects by technology.
- Project detail uses `<dt>/<dd>` outside a `<dl>` (invalid markup).
- Contact success state is a dead end (no "send another"); no character guidance on the message.
- Legal pages are inline-styled and visually disconnected from the rest of the site.

**Admin**
- Dashboard stats are hard-coded to `0` even though services provide real counts.
- Tables have no search, filters, sorting, or pagination; they overflow horizontally on phones.
- The Featured page never loads projects (hard-coded empty array), so it's unusable.
- The project create/edit forms are duplicated in two components.
- Placeholder editors (Hero, About, SEO, Social, Contact Info, Footer) show a **success** toast
  although nothing is persisted: misleading feedback.
- The sidebar doesn't highlight the active section on nested routes (e.g. `/projects/new`).
- No page-level error states or skeletons; the full-screen loader flashes on fast navigations.
- The ESLint config fails to load (`jsx-a11y` plugin registered twice).

## 3. Design direction (adapted from azari-client, not copied)

| azari pattern | Adaptation here |
|---|---|
| Floating glass "pill" navbar offset from the top, sliding active indicator | Same structure, indigo gradient indicator animated with a shared `layoutId`; accessible mobile panel (Escape, outside click, route change close). |
| `routePageEnter` fade-up page transition (420 ms, `cubic-bezier(.22,1,.36,1)`) with reduced-motion opt-out | `app/(public)/template.tsx` + admin content template using the same easing token. |
| Outfit display face + Inter body | `next/font` self-hosted Outfit for headings (CSP `font-src 'self'` stays intact). |
| Bottom-weighted hero with strong headline, accent highlight, two CTAs | Kept the portfolio's photo + 3 CTAs; stronger type scale, ambient grid/glow backdrop. |
| Scroll-reveal sections | `Reveal` component (`whileInView`, once), disabled under `prefers-reduced-motion`. |
| Admin: sticky top bar + grouped sidebar with accent rail on the active item, stat cards (label → value), filter bar + count, bordered tables, status badges, toggle switches | Same information architecture on the portfolio's indigo token set; tables collapse to cards on mobile. |
| Full-screen branded page loader | Kept (the previous commit chose it), now delayed 150 ms so fast navigations don't flash. |

Brand stays: dark `#0a0a0f`, indigo accent (PLAN.md §7). No light theme in this pass: the
nonce-based CSP makes an anti-flash inline script non-trivial and PLAN.md is dark-first.

## 4. Implementation plan

1. **Foundation**: runtime CSS custom properties generated from the LESS tokens, motion and
   z-index tokens, display font, shared icon set, and UI primitives in `components/ui/`:
   `Button` (polymorphic `button`/`Link`), `Badge`, `Card`, `Field` + `Input`/`Textarea`/`Select`,
   `Switch`, `Alert`, `EmptyState`, `Skeleton`, `SectionHeading`, `Reveal`, a focus-trapping
   animated `Modal`, `ConfirmModal`, and toasts. Fix the ESLint config.
2. **Public shell**: pill navbar, footer, page transition template, polished loader,
   `error.tsx` boundaries, restyled `not-found`.
3. **Public pages**: hero, swipeable featured carousel, CTA band, project explorer
   (search + technology filter), project detail, about (section nav + timelines), contact
   (channel cards, character counter, reset after success), legal pages via a shared layout.
4. **Admin**: top bar + collapsible sidebar, dashboard with real counts and recent activity,
   generic `DataTable` with a `ListQuery` engine (search, filter, sort, pagination, mobile
   cards), shared `ProjectForm`, functional Featured manager (uses the existing
   `updateProjectAction`), honest "not yet persisted" notices on placeholder editors.
5. **Docs**: update `PLAN.md` changelog/ADRs and `docs/COMPONENTS.md`.

## 5. Backend impact

**None.** No schema, repository, service, action, route handler, proxy, or auth change.
The admin dashboard and Featured page only *read* through existing services, and featured
toggles call the existing `updateProjectAction` with the project's current values.

## 6. Outcome & follow-ups

Implemented as planned; verified with `tsc`, ESLint, `next build`, and Playwright flows covering
login (including wrong password and callback redirect), project search/filter/sort, edit, create,
delete, featured toggles, inbox open/mark-read/delete, placeholder editors, mobile drawer,
sidebar collapse persistence, sign-out, and a production contact-form submission.

Findings outside the scope of a presentation change (not modified):

| Finding | Why not changed here | Suggested fix |
|---|---|---|
| Featured order isn't editable | `featuredOrder` isn't in the project Server Action schema | Add an optional `featuredOrder` to the Zod schema (backward-compatible), then a reorder UI. |
| Resume button 404s | No `public/resume.pdf` in the repo | Add the file, or point `siteConfig.resumeUrl` at hosted storage. |
| Dev-only CSP block of admin `loading` chunks | Pre-existing; security configuration; absent in production builds | Investigate Turbopack dev chunk loading under `'strict-dynamic'`. |
| Placeholder editors don't persist | Repositories for Hero/About/SEO/etc. don't exist yet | Implement repositories + Server Actions; `PlaceholderEditor` has a single TODO hook point. |
