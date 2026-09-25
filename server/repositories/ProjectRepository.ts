import type { Project, CreateProjectInput, ProjectListParams, UpdateProjectInput } from "@/server/domain/entities";
import type { Paginated } from "@/server/domain/types";
import { BaseRepository } from "./BaseRepository";

export abstract class ProjectRepository extends BaseRepository<
  Project,
  CreateProjectInput,
  UpdateProjectInput
> {
  abstract findBySlug(slug: string): Promise<Project | null>;
  abstract findFeatured(): Promise<Project[]>;
  /** Defaults to the `newest` order. */
  abstract findAll(params?: ProjectListParams): Promise<Paginated<Project>>;
}
