import type { Project, CreateProjectInput, UpdateProjectInput } from "@/server/domain/entities";
import type { Paginated, PaginationParams } from "@/server/domain/types";
import { BaseRepository } from "./BaseRepository";

export abstract class ProjectRepository extends BaseRepository<
  Project,
  CreateProjectInput,
  UpdateProjectInput
> {
  abstract findBySlug(slug: string): Promise<Project | null>;
  abstract findFeatured(): Promise<Project[]>;
  abstract findAll(params?: PaginationParams): Promise<Paginated<Project>>;
}
