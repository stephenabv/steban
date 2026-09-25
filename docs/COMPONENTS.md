# Component Reference

This document describes every component and feature module in the project.

---

## Table of Contents

- [Layout Components](#layout-components)
  - [Navbar](#navbar)
  - [Footer](#footer)
  - [GoogleAnalytics](#googleanalytics)
- [Feature Modules](#feature-modules)
  - [Home](#home)
  - [Projects](#projects)
  - [About](#about)
  - [Contact](#contact)
  - [Admin](#admin)
- [Pages](#pages)
  - [Public Pages](#public-pages)
  - [Admin Pages](#admin-pages)
- [Root Layout](#root-layout)

---

## Layout Components

These live in `components/layout/` and are used across multiple pages.

---

### Navbar

**File:** `components/layout/Navbar.tsx`  
**Type:** Client component (`"use client"`)

The top navigation bar, rendered on all public pages via `app/(public)/layout.tsx`.

**Features:**
- **Responsive:** Shows a full link list on desktop; collapses to a hamburger icon on mobile.
- **Mobile menu:** Animated slide-in panel using Framer Motion.
- **Scroll behavior:** Applies a styling change (shadow, reduced height) when the page has scrolled past 50px.
- **Logo:** Displays the owner's name with split first/last name styling.
- **Active route highlighting:** Uses `usePathname()` to mark the current page link as active.

**Navigation links:** Home, Projects, About, Contact.

---

### Footer

**File:** `components/layout/Footer.tsx`  
**Type:** Server component

Site footer rendered on all public pages.

**Contents:**
- Copyright notice.
- Links to Privacy Policy and Terms of Service.
- Social media links (from `config/social.ts`).

---

### GoogleAnalytics

**File:** `components/layout/GoogleAnalytics.tsx`  
**Type:** Client component

Loads the GA4 tracking script via `next/script` with the `afterInteractive` strategy. Renders nothing (returns `null`) unless `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set and the app is running in production.

---

## Feature Modules

Feature components live in `features/<domain>/`. They own only the UI for their domain — they do not handle routing or data fetching.

---

### Home

#### HeroSection

**File:** `features/home/HeroSection.tsx`  
**Type:** Client component (`"use client"`)

The top section of the home page.

**Contents:**
- Profile photo.
- Animated name, title, and introduction text using Framer Motion staggered fade-up animations.
- Three CTA buttons: **View Projects** (links to `/projects`), **Contact** (links to `/contact`), **Resume** (links to `/resume.pdf`, which streams the PDF uploaded in Admin → Resume; the button is hidden until a resume is uploaded).
- Scroll indicator arrow at the bottom.

**Props:**

| Prop | Type | Description |
|---|---|---|
| `hero` | `Hero \| null` | Data object with `name`, `title`, `introduction`, `photoUrl`, `photoAlt` |
| `resumeAvailable` | `boolean` | Whether an uploaded resume is published; hides the Resume button otherwise |

---

#### FeaturedCarousel

**File:** `features/home/FeaturedCarousel.tsx`  
**Type:** Client component (`"use client"`)

Auto-rotating carousel of featured projects displayed below the hero section.

**Features:**
- Rotates automatically every 5 seconds.
- Pauses on mouse hover or keyboard focus.
- Previous / next navigation arrows.
- Dot indicator row for direct slide selection.
- Each slide shows: cover image, project title, summary, technology tags, and links to the GitHub repo and live demo.

**Props:**

| Prop | Type | Description |
|---|---|---|
| `projects` | `Project[]` | Array of featured projects, ordered by `featuredOrder` |

---

### Projects

#### ProjectGrid

**File:** `features/projects/ProjectGrid.tsx`  
**Type:** Server component (or client — check file for `"use client"` directive)

A responsive grid of all portfolio projects.

**Each card displays:**
- Cover image.
- Project title.
- Short summary.
- Up to 5 technology tags.
- Link to the project detail page (`/projects/:slug`).

**Props:**

| Prop | Type | Description |
|---|---|---|
| `projects` | `Project[]` | Array of all projects |

---

### About

#### AboutContent

**File:** `features/about/AboutContent.tsx`  
**Type:** Server component

Renders the full about section content.

**Sections:**
- Biography (long-form text).
- Skills list.
- Work experience entries.
- Education history.
- Certifications and awards.

**Props:**

| Prop | Type | Description |
|---|---|---|
| `about` | `About` | Data object with `bio`, `skills`, `experience`, `education`, `certifications`, `awards` |

---

### Contact

#### ContactForm

**File:** `features/contact/ContactForm.tsx`  
**Type:** Client component (`"use client"`)

Interactive contact form.

**Fields:** Name, Email, Subject, Message.

**Behavior:**
- Client-side validation with real-time error messages (aria-invalid for accessibility).
- Submits to `POST /api/contact`.
- Displays a success message after a successful submission.
- Displays a generic error message on server failure.

---

### Admin

#### AdminSidebar

**File:** `features/admin/AdminSidebar.tsx`  
**Type:** Client component (`"use client"`)

Left-hand navigation sidebar for the admin dashboard.

**Structure:**

| Section | Links |
|---|---|
| Content | Hero, About, Projects, Featured, Contact Info |
| Site | SEO, Analytics, Social Links, Footer |
| Inbox | Messages |

**Features:**
- Active route highlighting using `usePathname()`.
- SVG icon per navigation item.
- **View Site** link (opens public site in new tab).
- **Sign Out** button (calls `POST /api/auth/logout` and redirects to `/admin/login`).

---

#### AdminLoginForm

**File:** `features/admin/AdminLoginForm.tsx`  
**Type:** Client component (`"use client"`)

Username and password login form for the admin area.

- Submits to `POST /api/auth/login`.
- Shows inline error message on failed authentication.
- Redirects to `/admin` on success.

---

## Pages

### Public Pages

All public pages are in `app/(public)/`. They share a layout that wraps content with `<Navbar>` and `<Footer>`.

| Route | File | Description |
|---|---|---|
| `/` | `app/(public)/page.tsx` | Home: renders `HeroSection` + `FeaturedCarousel`. Outputs JSON-LD (Person + WebSite schemas). |
| `/projects` | `app/(public)/projects/page.tsx` | Full project gallery using `ProjectGrid`. |
| `/projects/:slug` | `app/(public)/projects/[slug]/page.tsx` | Individual project detail page. |
| `/about` | `app/(public)/about/page.tsx` | About page using `AboutContent`. |
| `/contact` | `app/(public)/contact/page.tsx` | Contact page using `ContactForm` + social link list. |
| `/privacy` | `app/(public)/privacy/page.tsx` | Privacy policy (static content). |
| `/terms` | `app/(public)/terms/page.tsx` | Terms of service (static content). |

All pages include full Next.js Metadata (title, description, OG, Twitter, canonical) via `generateMetadata` or a static `metadata` export.

---

### Admin Pages

All admin pages are in `app/admin/`. They share a layout that wraps content with `<AdminSidebar>`.

Access is protected at the middleware level (`proxy.ts`) — unauthenticated requests to any `/admin/*` route are redirected to `/admin/login`.

| Route | File | Description |
|---|---|---|
| `/admin` | `app/admin/page.tsx` | Dashboard: exact counts (projects, featured, messages, unread — from `COUNT(*)` queries) + recent activity. |
| `/admin/login` | `app/admin/login/page.tsx` | Login page using `AdminLoginForm`. |
| `/admin/hero` | `app/admin/(dashboard)/hero/page.tsx` | `HeroEditor`: name, title, introduction, photo URL + alt text (saved; drives the home hero and JSON-LD). |
| `/admin/resume` | `app/admin/(dashboard)/resume/page.tsx` | Resume management: view current PDF and metadata, upload or replace (`ResumeManager`). |
| `/admin/about` | `app/admin/(dashboard)/about/page.tsx` | `AboutEditor`: biography plus reorderable skills, experience, education, certifications and awards. |
| `/admin/projects` | `app/admin/projects/page.tsx` | Project list with create / edit / delete controls. |
| `/admin/featured` | `app/admin/featured/page.tsx` | Drag-and-drop or ordered selection of featured projects for the carousel. |
| `/admin/contact-info` | `app/admin/(dashboard)/contact-info/page.tsx` | `ContactEmailEditor`: public contact email (empty hides email links). |
| `/admin/seo` | `app/admin/(dashboard)/seo/page.tsx` | `SeoEditor`: per-page title, description, keywords, share image, noindex, with defaults and a search preview. |
| `/admin/analytics` | `app/admin/analytics/page.tsx` | Displays current GA4 configuration status. |
| `/admin/social` | `app/admin/(dashboard)/social/page.tsx` | `SocialLinksEditor`: GitHub, LinkedIn, Facebook URLs (empty hides a profile). |
| `/admin/footer` | `app/admin/(dashboard)/footer/page.tsx` | `FooterEditor`: privacy and terms links (site path or https URL). |
| `/admin/messages` | `app/admin/messages/page.tsx` | Table of contact form submissions with read/unread status. |

---

## Root Layout

**File:** `app/layout.tsx`

The root layout wraps every page in the application.

**Responsibilities:**
- Imports and applies Google Fonts: **Inter** (body text) and **JetBrains Mono** (monospace / code).
- Sets the global `<html lang="en">` attribute.
- Outputs a **skip to main content** link for keyboard and screen-reader accessibility.
- Renders `<GoogleAnalytics />`.
- Sets the default site-wide metadata (title template, description, OG, Twitter, robots, icons).
- Applies CSS variables from the LESS token system.
