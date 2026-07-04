# Deployment

This document covers deploying the portfolio to Vercel (recommended) and general production checklist items.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Vercel Deployment](#vercel-deployment)
- [Environment Variables Checklist](#environment-variables-checklist)
- [Vercel Integrations](#vercel-integrations)
- [Custom Domain](#custom-domain)
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
| `NEXT_PUBLIC_SITE_URL` | `https://stephenabueva.com` | No trailing slash. |

### Optional

| Variable | Example value | Notes |
|---|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-XXXXXXXXXX` | GA4 only fires in production. Leave unset in preview/development. |

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

1. In the Vercel dashboard → your project → **Settings** → **Domains**.
2. Add your domain (e.g. `stephenabueva.com`).
3. Vercel provides DNS records; add them in your domain registrar.
4. Update `NEXT_PUBLIC_SITE_URL` to match your custom domain.
5. Vercel issues a free TLS certificate automatically.

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
- [ ] `robots.txt` is accessible at `/robots.txt` and blocks `/admin/` and `/api/`.
- [ ] `/admin/` redirects to `/admin/login` when not authenticated (verify in an incognito window).
- [ ] Contact form rate limiting works (submit more than 5 times quickly; should receive a 429).

### SEO

- [ ] `sitemap.xml` is accessible at `/sitemap.xml`.
- [ ] Home page outputs JSON-LD structured data (check with Google's Rich Results Test).
- [ ] All pages have unique `<title>` and `<meta name="description">` tags.
- [ ] OG images render correctly (check with a social media link preview tool).

### Analytics

- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set in the **Production** environment only.
- [ ] GA4 fires correctly on the live site (check the GA4 Realtime dashboard).

### Content

- [ ] Profile photo loads at the correct URL.
- [ ] Resume PDF link (`/resume.pdf` or external URL) is accessible.
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
    server_name stephenabueva.com;

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
