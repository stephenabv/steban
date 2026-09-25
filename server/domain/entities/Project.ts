export interface Project {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  coverImage: string;
  gallery: string[];
  technologies: string[];
  features: string[];
  githubUrl?: string;
  liveUrl?: string;
  featured: boolean;
  featuredOrder?: number;
  publishedAt: Date;
  updatedAt: Date;
}

export type CreateProjectInput = Omit<Project, "id" | "publishedAt" | "updatedAt">;
export type UpdateProjectInput = Partial<CreateProjectInput>;

/**
 * List orderings:
 * - `newest`: most recently published first (admin lists, "recent" feeds).
 * - `featuredFirst`: featured projects first in carousel order
 *   (featuredOrder, then newest), then the rest newest first — the public showcase.
 */
export type ProjectListOrder = "newest" | "featuredFirst";

export interface ProjectListParams {
  page?: number;
  pageSize?: number;
  order?: ProjectListOrder;
}
