# Design System

One visual language for the public site and the admin dashboard. Build new UI from these
pieces rather than writing page-specific styles.

## Tokens — `styles/variables.less`

| Group | Examples | Notes |
|---|---|---|
| Surfaces | `@color-bg`, `@color-bg-subtle`, `@color-bg-card`, `@color-bg-elevated`, `@color-bg-hover` | Dark-first, layered from darkest to lightest. |
| Borders | `@color-border`, `@color-border-hover`, `@color-border-strong` | Translucent white, so they work on any surface. |
| Text | `@color-text-primary`, `@color-text-secondary`, `@color-text-muted` | Secondary and muted meet WCAG AA on card surfaces. |
| Accent | `@color-accent` (indigo), `-light`, `-lighter`, `-soft`, `@gradient-accent` | Cyan (`@color-accent-2`) is for gradients only. |
| Status | `@color-success`, `@color-warning`, `@color-error`, `@color-info` | |
| Type | `@font-sans` (Inter), `@font-display` (Outfit, headings), `@font-mono` | Scale `@fs-xs` … `@fs-8xl`. |
| Space | `@space-1` (4px) … `@space-32` | 4px base. |
| Radius | `@radius-xs` … `@radius-xl`, `@radius-full` | Pills for buttons and chips, `lg` for cards, `xl` for dialogs. |
| Motion | `@ease-out`, `@duration-fast/normal/slow/page` | `lib/motion.ts` mirrors the easing for Framer Motion. |
| Layers | `@z-sticky` < `@z-drawer` < `@z-nav` < `@z-modal` < `@z-toast` < `@z-loader` | Use these, never raw numbers. |

Runtime mirrors (`--color-*`, `--ease-out`, …) live on `:root` in `styles/globals.less`.

Mixins (`styles/mixins.less`): `.container()`, `.section-spacing()`, `.surface()`, `.card()`,
`.glass()`, `.display()`, `.eyebrow()`, `.accent-text()`, `.control-base()`, `.focus-ring()`,
`.focus-ring-inset()`, `.line-clamp(n)`, `.reduced-motion()`, `.visually-hidden()`.

## Primitives — `components/ui`

| Component | Purpose |
|---|---|
| `Button` | Polymorphic: `<button>`, internal `<Link>`, or external `<a>` (safe `rel`), chosen from `href`. Variants `primary · secondary · ghost · danger · dangerSolid · link`, sizes `sm · md · lg`, `icon`/`iconRight`, `iconOnly`, `loading`. |
| `Badge` | Status label. Tones `neutral · accent · success · warning · danger · info`, optional `dot`/`pulse`. |
| `Card`, `CardHeader` | Surface with padding presets; header with title, description and actions. |
| `Alert` | Inline persistent feedback; `danger` uses `role="alert"`. |
| `EmptyState` | Icon + title + description + action. Use for every empty list/result. |
| `Skeleton` | Loading placeholder (shimmer off under reduced motion). |
| `Field` + `Input` / `Textarea` / `Select` | `Field` owns label, hint, error and character counter and wires `id`/`aria-describedby`/`aria-invalid` into the control via context. |
| `SearchInput`, `Switch` | Search with clear button and Escape-to-clear; accessible `role="switch"` checkbox. |
| `formLayout` | `grid` / `span2` helpers for two-column forms (server-safe module). |
| `Modal`, `ConfirmModal` | Portal, focus trap, Escape/backdrop close, animated, bottom sheet on phones. Pass `dismissible={false}` while busy. |
| `ToastProvider` / `useToast` | Transient feedback after actions. Errors persist longer. |
| `SectionHeading`, `Highlight` | Eyebrow + title + description, `page` (h1) or `section` (h2) scale. |
| `Reveal` | Scroll fade-up as progressive enhancement: content stays visible without JS. |

Data views — `components/data`: `DataTable` (sortable headers, `aria-sort`, cards on phones),
`DataToolbar` (search, segmented filter with counts, mobile sort picker), `Pagination`.
They are driven by `lib/list/ListQuery` (filter/sort strategies) through `useListQuery`.

Icons — `components/icons/Icon.tsx`: one registry of stroke (24px grid) and brand glyphs.
Decorative by default; pass `label` when an icon carries meaning on its own.

## Patterns

- **Page frame**: public pages use `PageShell`; admin pages use `AdminPageHeader` inside `styles.page`.
- **Content editors**: build on `useContentForm` + `ContentEditor` (features/admin/content): Save is
  enabled only when dirty, server field errors map to `Field` by dotted path, leaving with unsaved
  edits asks first, and an expired session offers sign-in in a new tab. If the record can't be
  loaded, render `LoadError` instead of the form.
- **Transitions**: `template.tsx` files apply `.route-page` (fade-up, 420 ms). Don't add per-page entrances.
- **Reduced motion**: never branch *rendered output* on `useReducedMotion()` (it's `null` during
  SSR). `MotionProvider` sets `reducedMotion="user"` globally; CSS uses `.reduced-motion()`.
- **Destructive actions**: always `ConfirmModal` naming the item and stating the consequence.
- **Feedback**: toast for completed actions, `Alert` for page-level problems, `Field` errors for
  validation, `EmptyState` for "nothing here" (with the next step as its action).
- **Touch targets**: interactive controls are at least 36px (44px for primary mobile actions).
- **Server/client boundary**: constants and class maps used by Server Components must live in
  plain modules, not `"use client"` files (see `formLayout.ts`, `features/admin/constants.ts`).
