import type { Project } from "@/server/domain/entities";
import type { ProjectCardData } from "./types";

/** Client-safe projection for the project cards (dates as ISO strings). */
export function toProjectCardData(p: Project): ProjectCardData {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    coverImage: p.coverImage,
    technologies: p.technologies,
    featured: p.featured,
    publishedAt: p.publishedAt.toISOString(),
  };
}
