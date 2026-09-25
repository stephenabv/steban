import type { Project } from "@/server/domain/entities";
import type { AdminProjectRow } from "./ProjectFormModel";

/** Server → client projection (Dates serialised to ISO strings). */
export function toAdminProjectRow(p: Project): AdminProjectRow {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    description: p.description,
    coverImage: p.coverImage,
    technologies: p.technologies,
    features: p.features,
    githubUrl: p.githubUrl,
    liveUrl: p.liveUrl,
    featured: p.featured,
    publishedAt: p.publishedAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}
