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
