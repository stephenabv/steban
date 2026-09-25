import type { Project, CreateProjectInput, ProjectListParams, UpdateProjectInput } from "@/server/domain/entities";
import type { Paginated, Result } from "@/server/domain/types";
import { ok, err } from "@/server/domain/types";
import type { ProjectRepository } from "@/server/repositories";

export class ProjectService {
  constructor(private readonly repo: ProjectRepository) {}

  async getAll(params?: ProjectListParams): Promise<Result<Paginated<Project>>> {
    try {
      const result = await this.repo.findAll(params);
      return ok(result);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async getById(id: string): Promise<Result<Project | null>> {
    try {
      return ok(await this.repo.findById(id));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async getBySlug(slug: string): Promise<Result<Project | null>> {
    try {
      return ok(await this.repo.findBySlug(slug));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async getFeatured(): Promise<Result<Project[]>> {
    try {
      return ok(await this.repo.findFeatured());
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async create(input: CreateProjectInput): Promise<Result<Project>> {
    try {
      const project = await this.repo.create(input);
      return ok(project);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async update(id: string, input: UpdateProjectInput): Promise<Result<Project | null>> {
    try {
      return ok(await this.repo.update(id, input));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async delete(id: string): Promise<Result<boolean>> {
    try {
      return ok(await this.repo.delete(id));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }
}
