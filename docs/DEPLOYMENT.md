# Deployment

This document covers deploying the portfolio to Vercel (recommended) and general production checklist items.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Vercel Deployment](#vercel-deployment)
- [Environment Variables Checklist](#environment-variables-checklist)
- [Vercel Integrations](#vercel-integrations)
- [Custom Domain](#custom-domain)
- [Search Engine Indexing](#search-engine-indexing)
- [Preview Deployments](#preview-deployments)
- [Production Checklist](#production-checklist)
- [Self-Hosting](#self-hosting)

---

## Prerequisites

- A GitHub account with the repository pushed.
- A [Vercel](https://vercel.com) account.
- Your `ADMIN_PASSWORD_HASH` generated (see [README → Generate a password hash](../README.md#generating-a-password-hash)).
- A 32+ character random string for `SESSION_SECRET`.

Generate a secure `SESSION_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Vercel Deployment

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new).
2. Click **Import** next to your repository.
3. Leave the **Framework Preset** as **Next.js** (auto-detected).
4. Do not change the **Root Directory** (leave it as `/`).
5. Expand **Environment Variables** and add all required variables (see below).
6. Click **Deploy**.

---

## Environment Variables Checklist

Set these in **Vercel Dashboard → Project → Settings → Environment Variables**.

Apply each variable to **Production**, **Preview**, and **Development** environments as appropriate.

### Required (all environments)

| Variable | Example value | Notes |
|---|---|---|
| `SESSION_SECRET` | `a3f9...` (64 hex chars) | Must be at least 32 characters. Use a unique value per environment. |
| `ADMIN_USERNAME` | `stephen` | The admin login username. |
| `ADMIN_PASSWORD_HASH` | `a1b2c3...:d4e5f6...` | Output of the password hash script. |
| `NEXT_PUBLIC_SITE_URL` | `https://stephenabueva.dev` | No trailing slash. |

### Optional

| Variable | Example value | Notes |
|---|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-XXXXXXXXXX` | GA4 only fires in production. Leave unset in preview/development. |
| `GOOGLE_SITE_VERIFICATION` | `AbC123...` | Token from Search Console's **HTML tag** method (only the `content` value). Not needed if you verify by DNS. |
| `BING_SITE_VERIFICATION` | `0123ABCD...` | Token from Bing Webmaster Tools' `msvalidate.01` meta tag. Not needed if you import from Search Console. |
| `YANDEX_VERIFICATION` | `abc123...` | Token from Yandex Webmaster's meta tag. |
| `INDEXNOW_KEY` | `3f9c...` (32 hex chars) | Turns on IndexNow: served at `/indexnow-key.txt`, and production saves of projects, hero, about, SEO and legal pages ping Bing/Yandex. 8–128 letters, digits or hyphens. Generate with `openssl rand -hex 16`. |

### Auto-set by Vercel integrations

These are injected automatically — do not set them manually.

| Variable | Integration |
|---|---|
| `DATABASE_URL` | Postgres storage (Prisma Postgres, Neon, etc.) — used by the app |
| `POSTGRES_URL` | Postgres storage — fallback if `DATABASE_URL` is absent |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob |
| `KV_URL` | Vercel KV |
| `KV_REST_API_TOKEN` | Vercel KV |
| `KV_REST_API_READ_ONLY_TOKEN` | Vercel KV |
| `KV_REST_API_URL` | Vercel KV |

The app connects with plain `pg`, not `@vercel/postgres`, so it works with any Postgres-compatible connection string — it doesn't require Neon's pooled `-pooler.` hostname format.

---

## Vercel Integrations

### Postgres

Required for persistent content management via the admin dashboard.

1. In the Vercel dashboard → your project → **Storage** → **Connect Store**, add a Postgres-compatible store (Prisma Postgres, Neon, etc.) → **Create New**.
2. Choose a region closest to your visitors.
3. After creation, `DATABASE_URL` (and/or `POSTGRES_URL`) are automatically added.
4. Run the SQL schemas from [docs/DATABASE.md → Suggested SQL Schemas](DATABASE.md#suggested-sql-schemas) against the new database.
5. Implement and wire the concrete repository classes (see [docs/DATABASE.md → Repository Pattern](DATABASE.md#repository-pattern)).

### Vercel Blob

Required for image uploads (project cover images, profile photo).

1. In the Vercel dashboard → **Storage** → **Connect Store** → **Blob** → **Create New**.
2. The `BLOB_READ_WRITE_TOKEN` env var is automatically added.

---

## Custom Domain

Production is served at `https://stephenabueva.dev` (registered at Cloudflare, DNS managed by Cloudflare, hosted on Vercel). Every absolute URL the app emits (canonical links, Open Graph, JSON-LD, `sitemap.xml`, `robots.txt`, cover-letter portfolio link) is derived from `NEXT_PUBLIC_SITE_URL` via `config/site.ts`, so pointing a new domain at the site is configuration, not code.

### 1. Vercel: add the domain

1. Vercel dashboard → project → **Settings** → **Domains** → **Add** `stephenabueva.dev`, connected to the **Production** environment.
2. Accept Vercel's suggestion to also add `www.stephenabueva.dev` as a **308 redirect** to `stephenabueva.dev`.
3. Edit the old `steban.vercel.app` entry and set it to **Redirect to** `stephenabueva.dev` (308), so old links and search results land on the new domain.
4. Note the DNS values Vercel shows for each domain; use those exact values in step 2 if they differ from the defaults below.

### 2. Cloudflare: DNS records

Cloudflare dashboard → `stephenabueva.dev` → **DNS** → **Records**. Delete any existing apex `A`/`AAAA` or `www` records (e.g. registrar parking), then add:

| Type | Name | Content | Proxy status |
|---|---|---|---|
| `A` | `@` | `76.76.21.21` (or the IP Vercel shows) | **DNS only** (grey cloud) |
| `CNAME` | `www` | `cname.vercel-dns.com` (or the value Vercel shows) | **DNS only** (grey cloud) |

Keep both records **DNS only**. Vercel terminates TLS, issues the certificate and runs its own CDN and firewall; proxying through Cloudflare puts a second CDN in front, can break certificate issuance and renewal, and hides the visitor IP that the rate limiter and audit log read. If you have `CAA` records, add one allowing `letsencrypt.org`.

`.dev` is on the browser HSTS preload list, so the site is only reachable over HTTPS. That's already the case on Vercel.

### 3. Environment variable

Set `NEXT_PUBLIC_SITE_URL=https://stephenabueva.dev` for the **Production** environment, then **redeploy**. `NEXT_PUBLIC_*` values are inlined at build time, so an existing deployment keeps the old value until it is rebuilt.

### 4. Verify

- Vercel → Domains shows **Valid Configuration** for both domains and a certificate is issued.
- `https://stephenabueva.dev/sitemap.xml` and `/robots.txt` list `https://stephenabueva.dev` URLs.
- `https://steban.vercel.app` and `https://www.stephenabueva.dev` 308-redirect to `https://stephenabueva.dev`.

### Admin passkeys after a domain change

Passkeys are bound to the domain they were registered on (by default the host serving the request, see `server/auth/passkeys/relyingParty.ts`). Passkeys created on `steban.vercel.app` cannot sign in on `stephenabueva.dev`. Sign in with the admin password on the new domain, register a new passkey under **Admin → Passkeys**, then remove the old ones. Leave `WEBAUTHN_RP_ID` unset unless passkeys must be shared across subdomains.

---

## Search Engine Indexing

What the app already does, so you don't have to:

- **`/sitemap.xml`** lists every indexable public page: home, about, contact, privacy, terms, the projects index and each project (with its cover and gallery as image entries). It is regenerated hourly and immediately after a project is saved. `<lastmod>` is only set where a real content date exists (projects, about, legal pages), because Google ignores `lastmod` that isn't "consistently and verifiably accurate" and ignores `changefreq`/`priority` entirely, so those are not emitted.
- Pages marked **noindex** in Admin → SEO are left out of the sitemap, so Search Console never reports "Submitted URL marked noindex".
- **`/robots.txt`** allows everything and points at the sitemap. Admin and API routes are kept out of the index with an `X-Robots-Tag: noindex` header instead of robots.txt, which would advertise them.
- Requests to any `*.vercel.app` host get `X-Robots-Tag: noindex`, so the Vercel alias can't compete with `stephenabueva.dev` as duplicate content. Preview deployments are already noindexed by Vercel.
- **Structured data** (JSON-LD): `Person` and `WebSite` on the home page, `ProfilePage` and `BreadcrumbList` on About, `CreativeWork` and `BreadcrumbList` on each project. Every page has a canonical URL built from `NEXT_PUBLIC_SITE_URL`.

### One-time steps (outside the repo)

1. **Google Search Console** — <https://search.google.com/search-console> → **Add property** → **Domain** → `stephenabueva.dev`. Copy the `google-site-verification=...` TXT record into Cloudflare DNS (`TXT`, name `@`), then click **Verify**. A Domain property covers `www` and every protocol. (Alternative: a **URL prefix** property with the **HTML tag** method; put only the token in `GOOGLE_SITE_VERIFICATION` and redeploy.)
2. **Submit the sitemap to Google** — Search Console → **Sitemaps** → enter `sitemap.xml` → **Submit**. Then use **URL Inspection** on the home page and **Request indexing**.
3. **Bing Webmaster Tools** — <https://www.bing.com/webmasters> → **Import from Google Search Console** (fastest; it verifies the site and imports the sitemap). Otherwise add the site, verify with the `msvalidate.01` token in `BING_SITE_VERIFICATION` or a DNS CNAME, and submit `https://stephenabueva.dev/sitemap.xml` under **Sitemaps**. Bing's index also feeds DuckDuckGo, Yahoo and ChatGPT search.
4. **IndexNow (optional, recommended)** — set `INDEXNOW_KEY` for the **Production** environment and redeploy. Confirm `https://stephenabueva.dev/indexnow-key.txt` shows the key. From then on, each published change notifies Bing and other IndexNow engines within minutes. Google doesn't use IndexNow; it relies on the sitemap.
5. **Redirect the Vercel alias** — keep `steban.vercel.app` set to **Redirect to** `stephenabueva.dev` (see [Custom Domain](#custom-domain)), so existing links pass their signals to the canonical domain.
6. **Check** — run the home page, About page and a project through Google's [Rich Results Test](https://search.google.com/test/rich-results), and watch Search Console's **Pages** report over the following weeks.

---

## Preview Deployments

Every push to any branch (other than `main`) automatically creates a preview deployment at a unique URL. This is useful for reviewing changes before merging.

Preview deployments share the same environment variables as production unless you set environment-specific overrides in the Vercel dashboard.

---

## Production Checklist

Before going live, verify each item:

### Security

- [ ] `SESSION_SECRET` is at least 32 characters and unique (not the same as in development).
- [ ] `ADMIN_PASSWORD_HASH` uses a strong password (12+ characters, mixed case, numbers, symbols).
- [ ] `NEXT_PUBLIC_SITE_URL` is the exact production URL (used in OG tags, canonical URLs, sitemap).
- [ ] `robots.txt` is accessible at `/robots.txt`, and `/admin/login` responds with `X-Robots-Tag: noindex, nofollow`.
- [ ] `/admin/` redirects to `/admin/login` when not authenticated (verify in an incognito window).
- [ ] Contact form rate limiting works (submit more than 5 times quickly; should receive a 429).

### SEO

- [ ] `sitemap.xml` is accessible at `/sitemap.xml` and lists the production domain.
- [ ] Home, About and a project page pass Google's Rich Results Test.
- [ ] The domain is verified in Google Search Console and Bing Webmaster Tools, with the sitemap submitted (see [Search Engine Indexing](#search-engine-indexing)).
- [ ] All pages have unique `<title>` and `<meta name="description">` tags.
- [ ] OG images render correctly (check with a social media link preview tool).

### Analytics

- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set in the **Production** environment only.
- [ ] GA4 fires correctly on the live site (check the GA4 Realtime dashboard).

### Content

- [ ] Profile photo loads at the correct URL.
- [ ] A resume is uploaded in Admin → Resume, and `/resume.pdf` opens it (the home Resume button is hidden until then).
- [ ] All project links (GitHub, live demo) are correct.
- [ ] Contact form submits successfully.

### Performance

- [ ] Run Lighthouse on the production URL; target 90+ on all scores.
- [ ] Images use modern formats (AVIF / WebP) — verify in browser DevTools Network tab.

---

## Self-Hosting

The application is a standard Next.js app and can run anywhere Node.js is available.

### Build

```bash
npm run build
```

### Start

```bash
npm start
```

The server listens on port `3000` by default. Set the `PORT` environment variable to change it.

### Reverse proxy

Use Nginx or Caddy as a reverse proxy in front of the Node.js server to handle TLS termination and HTTP → HTTPS redirects.

Example Nginx config:

```nginx
server {
    listen 443 ssl;
    server_name stephenabueva.dev;

    ssl_certificate     /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Environment variables

Set all required variables in your shell environment or a `.env.local` file before starting the server.

> **Note:** When self-hosting, the in-memory rate limiter in `server/security/rateLimit.ts` resets on every restart. Replace it with a Redis-backed implementation for persistent limits across restarts and multiple instances.
