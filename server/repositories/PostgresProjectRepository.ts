import { sql } from "@vercel/postgres";
import { randomUUID } from "crypto";
import type { Project, CreateProjectInput, UpdateProjectInput } from "@/server/domain/entities";
import type { Paginated, PaginationParams } from "@/server/domain/types";
import { ProjectRepository } from "./ProjectRepository";

interface ProjectRow {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  cover_image: string;
  gallery: string[];
  technologies: string[];
  features: string[];
  github_url: string | null;
  live_url: string | null;
  featured: boolean;
  featured_order: number | null;
  published_at: string;
  updated_at: string;
}

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    description: row.description,
    coverImage: row.cover_image,
    gallery: row.gallery,
    technologies: row.technologies,
    features: row.features,
    githubUrl: row.github_url ?? undefined,
    liveUrl: row.live_url ?? undefined,
    featured: row.featured,
    featuredOrder: row.featured_order ?? undefined,
    publishedAt: new Date(row.published_at),
    updatedAt: new Date(row.updated_at),
  };
}

let tableReady: Promise<void> | null = null;

function ensureTable(): Promise<void> {
  tableReady ??= sql`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      cover_image TEXT NOT NULL DEFAULT '',
      gallery JSONB NOT NULL DEFAULT '[]',
      technologies JSONB NOT NULL DEFAULT '[]',
      features JSONB NOT NULL DEFAULT '[]',
      github_url TEXT,
      live_url TEXT,
      featured BOOLEAN NOT NULL DEFAULT FALSE,
      featured_order INT,
      published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.then(() => undefined);
  return tableReady;
}

/** Production repository backed by Vercel Postgres / Neon (POSTGRES_URL). */
export class PostgresProjectRepository extends ProjectRepository {
  async findById(id: string): Promise<Project | null> {
    await ensureTable();
    const { rows } = await sql<ProjectRow>`SELECT * FROM projects WHERE id = ${id}`;
    return rows[0] ? toProject(rows[0]) : null;
  }

  async findBySlug(slug: string): Promise<Project | null> {
    await ensureTable();
    const { rows } = await sql<ProjectRow>`SELECT * FROM projects WHERE slug = ${slug}`;
    return rows[0] ? toProject(rows[0]) : null;
  }

  async findFeatured(): Promise<Project[]> {
    await ensureTable();
    const { rows } = await sql<ProjectRow>`
      SELECT * FROM projects
      WHERE featured = TRUE
      ORDER BY featured_order NULLS LAST, published_at DESC
    `;
    return rows.map(toProject);
  }

  async findAll(params?: PaginationParams): Promise<Paginated<Project>> {
    await ensureTable();
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;
    const offset = (page - 1) * pageSize;
    const { rows } = await sql<ProjectRow>`
      SELECT * FROM projects ORDER BY published_at DESC LIMIT ${pageSize} OFFSET ${offset}
    `;
    const { rows: countRows } = await sql<{ count: string }>`SELECT COUNT(*) FROM projects`;
    return this.paginate(rows.map(toProject), Number(countRows[0].count), params);
  }

  async create(input: CreateProjectInput): Promise<Project> {
    await ensureTable();
    const id = randomUUID();
    const { rows } = await sql<ProjectRow>`
      INSERT INTO projects (
        id, slug, title, summary, description, cover_image,
        gallery, technologies, features, github_url, live_url, featured, featured_order
      ) VALUES (
        ${id}, ${input.slug}, ${input.title}, ${input.summary}, ${input.description},
        ${input.coverImage}, ${JSON.stringify(input.gallery)},
        ${JSON.stringify(input.technologies)}, ${JSON.stringify(input.features)},
        ${input.githubUrl ?? null}, ${input.liveUrl ?? null},
        ${input.featured}, ${input.featuredOrder ?? null}
      )
      RETURNING *
    `;
    return toProject(rows[0]);
  }

  async update(id: string, input: UpdateProjectInput): Promise<Project | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const merged = { ...existing, ...input };
    const { rows } = await sql<ProjectRow>`
      UPDATE projects SET
        slug = ${merged.slug},
        title = ${merged.title},
        summary = ${merged.summary},
        description = ${merged.description},
        cover_image = ${merged.coverImage},
        gallery = ${JSON.stringify(merged.gallery)},
        technologies = ${JSON.stringify(merged.technologies)},
        features = ${JSON.stringify(merged.features)},
        github_url = ${merged.githubUrl ?? null},
        live_url = ${merged.liveUrl ?? null},
        featured = ${merged.featured},
        featured_order = ${merged.featuredOrder ?? null},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0] ? toProject(rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    await ensureTable();
    const { rowCount } = await sql`DELETE FROM projects WHERE id = ${id}`;
    return (rowCount ?? 0) > 0;
  }
}
