# Database

This document covers the entity schemas, repository pattern, and the steps to connect the service layer to a real database.

---

## Table of Contents

- [Current State](#current-state)
- [Entity Schemas](#entity-schemas)
  - [Project](#project)
  - [Hero](#hero)
  - [About](#about)
  - [ContactInfo](#contactinfo)
  - [ContactMessage](#contactmessage)
  - [SeoMetadata](#seometadata)
- [Repository Pattern](#repository-pattern)
- [Connecting Vercel Postgres](#connecting-vercel-postgres)
- [Suggested SQL Schemas](#suggested-sql-schemas)

---

## Current State

The service and repository layers are fully implemented as TypeScript abstractions. The application runs against **mock / in-memory data** until concrete repository implementations are wired in.

To add persistence:
1. Add the Vercel Postgres integration to the project.
2. Create tables using the schemas below.
3. Implement concrete repository classes.
4. Inject them into the service layer.

---

## Entity Schemas

These TypeScript types are the source of truth for data shapes. They live in `server/domain/entities/`.

---

### Project

**File:** `server/domain/entities/Project.ts`

```ts
interface Project {
  id: string;                   // UUID
  slug: string;                 // URL-safe identifier, e.g. "my-project"
  title: string;
  summary: string;              // Short description (shown in cards/carousel)
  description: string;          // Full description (shown on detail page)
  coverImage: string;           // URL to cover image
  gallery: string[];            // Array of additional image URLs
  technologies: string[];       // Technology tags, e.g. ["Next.js", "TypeScript"]
  features: string[];           // Key feature bullet points
  githubUrl?: string;           // Optional GitHub repo link
  liveUrl?: string;             // Optional live demo link
  featured: boolean;            // Whether to show in the featured carousel
  featuredOrder?: number;       // Sort order within the carousel (lower = first)
  publishedAt: Date;
  updatedAt: Date;
}

interface CreateProjectInput {
  slug: string;
  title: string;
  summary: string;
  description: string;
  coverImage: string;
  gallery?: string[];
  technologies?: string[];
  features?: string[];
  githubUrl?: string;
  liveUrl?: string;
  featured?: boolean;
  featuredOrder?: number;
}

interface UpdateProjectInput extends Partial<CreateProjectInput> {}
```

---

### Hero

**File:** `server/domain/entities/Hero.ts`

```ts
interface Hero {
  name: string;
  title: string;              // Professional title, e.g. "Senior Software Engineer"
  introduction: string;       // Short introductory paragraph
  photoUrl: string;           // Profile photo URL
  photoAlt: string;           // Alt text for the photo
  resumeUrl: string;          // Link to resume PDF
}
```

---

### About

**File:** `server/domain/entities/About.ts`

```ts
interface About {
  bio: string;                            // Full biography text
  skills: string[];                       // List of skills
  experience: ExperienceEntry[];
  education: EducationEntry[];
  certifications: string[];
  awards: string[];
}

interface ExperienceEntry {
  company: string;
  role: string;
  startDate: string;                      // e.g. "January 2020"
  endDate?: string;                       // Omit for current position
  description: string;
}

interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  graduationYear: number;
}
```

---

### ContactInfo

**File:** `server/domain/entities/Contact.ts`

```ts
interface ContactInfo {
  email: string;
  phone?: string;
  address?: string;
  socialLinks: {
    github?: string;
    linkedin?: string;
    facebook?: string;
  };
}
```

---

### ContactMessage

**File:** `server/domain/entities/Contact.ts`

```ts
interface ContactMessage {
  id: string;           // UUID
  name: string;
  email: string;
  subject: string;
  message: string;
  ip: string;           // Submitter IP (for audit / spam filtering)
  createdAt: Date;
  read: boolean;        // Whether the admin has read it
}
```

---

### SeoMetadata

**File:** `server/domain/entities/SeoMetadata.ts`

```ts
interface SeoMetadata {
  pageRoute: string;      // e.g. "/" or "/projects"
  title: string;
  description: string;
  ogImage?: string;       // Absolute URL for Open Graph image
  noindex: boolean;       // Set true to add noindex directive
}
```

---

## Repository Pattern

All repositories extend `BaseRepository`:

```ts
// server/repositories/BaseRepository.ts
abstract class BaseRepository<TEntity, TCreate, TUpdate> {
  abstract findById(id: string): Promise<TEntity | null>;
  abstract findAll(params?: PaginationParams): Promise<Paginated<TEntity>>;
  abstract create(input: TCreate): Promise<TEntity>;
  abstract update(id: string, input: TUpdate): Promise<TEntity | null>;
  abstract delete(id: string): Promise<boolean>;

  protected paginate<T>(items: T[], page: number, pageSize: number): Paginated<T>;
}
```

Concrete implementations plug in by extending the domain-specific abstract class:

```ts
// Example implementation
import { sql } from '@vercel/postgres';

class PostgresProjectRepository extends ProjectRepository {
  async findById(id: string): Promise<Project | null> {
    const { rows } = await sql`SELECT * FROM projects WHERE id = ${id} LIMIT 1`;
    return rows[0] ? mapRowToProject(rows[0]) : null;
  }

  async findBySlug(slug: string): Promise<Project | null> {
    const { rows } = await sql`SELECT * FROM projects WHERE slug = ${slug} LIMIT 1`;
    return rows[0] ? mapRowToProject(rows[0]) : null;
  }

  async getFeatured(): Promise<Project[]> {
    const { rows } = await sql`
      SELECT * FROM projects
      WHERE featured = true
      ORDER BY featured_order ASC
    `;
    return rows.map(mapRowToProject);
  }

  // ... implement remaining abstract methods
}
```

---

## Connecting Vercel Postgres

### 1. Add the integration

In the Vercel dashboard → your project → **Storage** → **Connect Store** → choose **Postgres**. This sets all `POSTGRES_*` environment variables automatically.

### 2. Install the client

```bash
npm install @vercel/postgres
```

### 3. Run migrations

Use the SQL schemas below (or a migration tool like `node-postgres` migrations, `db-migrate`, or Drizzle ORM).

### 4. Inject concrete repositories

Update service constructors or a DI root file to use the Postgres implementations:

```ts
// server/services/index.ts
import { PostgresProjectRepository } from '../repositories/postgres/PostgresProjectRepository';

export const projectService = new ProjectService(new PostgresProjectRepository());
```

---

## Suggested SQL Schemas

```sql
-- Projects
CREATE TABLE projects (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           VARCHAR(255) NOT NULL UNIQUE,
  title          VARCHAR(255) NOT NULL,
  summary        TEXT NOT NULL,
  description    TEXT NOT NULL,
  cover_image    TEXT NOT NULL,
  gallery        TEXT[] DEFAULT '{}',
  technologies   TEXT[] DEFAULT '{}',
  features       TEXT[] DEFAULT '{}',
  github_url     TEXT,
  live_url       TEXT,
  featured       BOOLEAN NOT NULL DEFAULT false,
  featured_order INTEGER,
  published_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hero (single row)
CREATE TABLE hero (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  title         VARCHAR(255) NOT NULL,
  introduction  TEXT NOT NULL,
  photo_url     TEXT NOT NULL,
  photo_alt     TEXT NOT NULL,
  resume_url    TEXT NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- About (single row)
CREATE TABLE about (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bio              TEXT NOT NULL,
  skills           TEXT[] DEFAULT '{}',
  experience       JSONB NOT NULL DEFAULT '[]',
  education        JSONB NOT NULL DEFAULT '[]',
  certifications   TEXT[] DEFAULT '{}',
  awards           TEXT[] DEFAULT '{}',
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contact info (single row)
CREATE TABLE contact_info (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        VARCHAR(255) NOT NULL,
  phone        VARCHAR(50),
  address      TEXT,
  social_links JSONB NOT NULL DEFAULT '{}',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contact messages
CREATE TABLE contact_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  subject    VARCHAR(255) NOT NULL,
  message    TEXT NOT NULL,
  ip         VARCHAR(45) NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SEO metadata (one row per route)
CREATE TABLE seo_metadata (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_route  VARCHAR(255) NOT NULL UNIQUE,
  title       VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  og_image    TEXT,
  noindex     BOOLEAN NOT NULL DEFAULT false,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_slug ON projects (slug);
CREATE INDEX idx_projects_featured ON projects (featured, featured_order);
CREATE INDEX idx_contact_messages_read ON contact_messages (read);
CREATE INDEX idx_seo_metadata_route ON seo_metadata (page_route);
```
