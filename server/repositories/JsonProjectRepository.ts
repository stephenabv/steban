import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type {
  Project,
  CreateProjectInput,
  ProjectListOrder,
  ProjectListParams,
  UpdateProjectInput,
} from "@/server/domain/entities";
import type { Paginated } from "@/server/domain/types";
import { ProjectRepository } from "./ProjectRepository";

type Comparator = (a: Project, b: Project) => number;

const newest: Comparator = (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime();
/** Carousel order: explicit featuredOrder first, then newest. */
const featuredOrder: Comparator = (a, b) =>
  (a.featuredOrder ?? Number.MAX_SAFE_INTEGER) - (b.featuredOrder ?? Number.MAX_SAFE_INTEGER) || newest(a, b);

const COMPARATORS: Record<ProjectListOrder, Comparator> = {
  newest,
  featuredFirst: (a, b) =>
    Number(b.featured) - Number(a.featured) || (a.featured ? featuredOrder(a, b) : newest(a, b)),
};

const DATA_FILE = path.join(process.cwd(), "data", "projects.json");

type StoredProject = Omit<Project, "publishedAt" | "updatedAt"> & {
  publishedAt: string;
  updatedAt: string;
};

function revive(stored: StoredProject): Project {
  return {
    ...stored,
    publishedAt: new Date(stored.publishedAt),
    updatedAt: new Date(stored.updatedAt),
  };
}

/**
 * File-backed repository for local development (no DATABASE_URL/POSTGRES_URL configured).
 * Not suitable for serverless production — the filesystem there is ephemeral.
 */
export class JsonProjectRepository extends ProjectRepository {
  private async readAll(): Promise<Project[]> {
    try {
      const raw = await fs.readFile(DATA_FILE, "utf-8");
      return (JSON.parse(raw) as StoredProject[]).map(revive);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw e;
    }
  }

  private async writeAll(projects: Project[]): Promise<void> {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(projects, null, 2), "utf-8");
  }

  async findById(id: string): Promise<Project | null> {
    const all = await this.readAll();
    return all.find((p) => p.id === id) ?? null;
  }

  async findBySlug(slug: string): Promise<Project | null> {
    const all = await this.readAll();
    return all.find((p) => p.slug === slug) ?? null;
  }

  async findFeatured(): Promise<Project[]> {
    const all = await this.readAll();
    return all
      .filter((p) => p.featured)
      .sort(featuredOrder);
  }

  async findAll(params?: ProjectListParams): Promise<Paginated<Project>> {
    const all = (await this.readAll()).sort(COMPARATORS[params?.order ?? "newest"]);
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;
    const items = all.slice((page - 1) * pageSize, page * pageSize);
    return this.paginate(items, all.length, params);
  }

  async create(input: CreateProjectInput): Promise<Project> {
    const all = await this.readAll();
    if (all.some((p) => p.slug === input.slug)) {
      throw new Error(`A project with slug "${input.slug}" already exists.`);
    }
    const now = new Date();
    const project: Project = { ...input, id: randomUUID(), publishedAt: now, updatedAt: now };
    all.push(project);
    await this.writeAll(all);
    return project;
  }

  async update(id: string, input: UpdateProjectInput): Promise<Project | null> {
    const all = await this.readAll();
    const index = all.findIndex((p) => p.id === id);
    if (index === -1) return null;
    if (input.slug && all.some((p) => p.slug === input.slug && p.id !== id)) {
      throw new Error(`A project with slug "${input.slug}" already exists.`);
    }
    const updated: Project = { ...all[index], ...input, updatedAt: new Date() };
    all[index] = updated;
    await this.writeAll(all);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const all = await this.readAll();
    const remaining = all.filter((p) => p.id !== id);
    if (remaining.length === all.length) return false;
    await this.writeAll(remaining);
    return true;
  }
}
