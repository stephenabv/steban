/** Client-safe projection of a Project for listing UIs (no Date objects). */
export interface ProjectCardData {
  id: string;
  slug: string;
  title: string;
  summary: string;
  coverImage: string;
  technologies: string[];
  featured: boolean;
  publishedAt: string;
}
