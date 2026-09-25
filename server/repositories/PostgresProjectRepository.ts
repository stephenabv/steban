import { randomUUID } from "crypto";
import { getPool } from "@/server/db/pool";
import { ensureOnce } from "@/server/db/ensureOnce";
import type {
  Project,
  CreateProjectInput,
  ProjectListOrder,
  ProjectListParams,
  UpdateProjectInput,
} from "@/server/domain/entities";
import type { Paginated } from "@/server/domain/types";
import { ProjectRepository } from "./ProjectRepository";

/** Allow-listed ORDER BY clauses; `id` is the final tie-breaker so pagination is stable. */
const ORDER_BY: Record<ProjectListOrder, string> = {
  newest: "published_at DESC, id",
  featuredFirst: "featured DESC, (CASE WHEN featured THEN featured_order END) NULLS LAST, published_at DESC, id",
};

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

const ensureTable = ensureOnce(() =>
  getPool().query(
    `CREATE TABLE IF NOT EXISTS projects (
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
      )`
  )
);

/** Production repository backed by a standard Postgres connection (DATABASE_URL / POSTGRES_URL). */
export class PostgresProjectRepository extends ProjectRepository {
  async findById(id: string): Promise<Project | null> {
    await ensureTable();
    const { rows } = await getPool().query<ProjectRow>("SELECT * FROM projects WHERE id = $1", [
      id,
    ]);
    return rows[0] ? toProject(rows[0]) : null;
  }

  async findBySlug(slug: string): Promise<Project | null> {
    await ensureTable();
    const { rows } = await getPool().query<ProjectRow>("SELECT * FROM projects WHERE slug = $1", [
      slug,
    ]);
    return rows[0] ? toProject(rows[0]) : null;
  }

  async findFeatured(): Promise<Project[]> {
    await ensureTable();
    const { rows } = await getPool().query<ProjectRow>(
      `SELECT * FROM projects
       WHERE featured = TRUE
       ORDER BY featured_order NULLS LAST, published_at DESC`
    );
    return rows.map(toProject);
  }

  async findAll(params?: ProjectListParams): Promise<Paginated<Project>> {
    await ensureTable();
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;
    const offset = (page - 1) * pageSize;
    const { rows } = await getPool().query<ProjectRow>(
      `SELECT * FROM projects ORDER BY ${ORDER_BY[params?.order ?? "newest"]} LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    );
    const { rows: countRows } = await getPool().query<{ count: string }>(
      "SELECT COUNT(*) FROM projects"
    );
    return this.paginate(rows.map(toProject), Number(countRows[0].count), params);
  }

  async create(input: CreateProjectInput): Promise<Project> {
    await ensureTable();
    const id = randomUUID();
    const { rows } = await getPool().query<ProjectRow>(
      `INSERT INTO projects (
        id, slug, title, summary, description, cover_image,
        gallery, technologies, features, github_url, live_url, featured, featured_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        id,
        input.slug,
        input.title,
        input.summary,
        input.description,
        input.coverImage,
        JSON.stringify(input.gallery),
        JSON.stringify(input.technologies),
        JSON.stringify(input.features),
        input.githubUrl ?? null,
        input.liveUrl ?? null,
        input.featured,
        input.featuredOrder ?? null,
      ]
    );
    return toProject(rows[0]);
  }

  async update(id: string, input: UpdateProjectInput): Promise<Project | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const merged = { ...existing, ...input };
    const { rows } = await getPool().query<ProjectRow>(
      `UPDATE projects SET
        slug = $1,
        title = $2,
        summary = $3,
        description = $4,
        cover_image = $5,
        gallery = $6,
        technologies = $7,
        features = $8,
        github_url = $9,
        live_url = $10,
        featured = $11,
        featured_order = $12,
        updated_at = NOW()
      WHERE id = $13
      RETURNING *`,
      [
        merged.slug,
        merged.title,
        merged.summary,
        merged.description,
        merged.coverImage,
        JSON.stringify(merged.gallery),
        JSON.stringify(merged.technologies),
        JSON.stringify(merged.features),
        merged.githubUrl ?? null,
        merged.liveUrl ?? null,
        merged.featured,
        merged.featuredOrder ?? null,
        id,
      ]
    );
    return rows[0] ? toProject(rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    await ensureTable();
    const { rowCount } = await getPool().query("DELETE FROM projects WHERE id = $1", [id]);
    return (rowCount ?? 0) > 0;
  }
}
