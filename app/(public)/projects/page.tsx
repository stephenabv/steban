import type { Metadata } from "next";
import { ProjectExplorer } from "@/features/projects/ProjectExplorer";
import type { ProjectCardData } from "@/features/projects/types";
import { PageShell } from "@/features/shared/PageShell";
import { CtaBand } from "@/features/shared/CtaBand";
import { Alert } from "@/components/ui/Alert";
import { siteUrl } from "@/config/site";
import { getPageMetadata } from "@/lib/content/publicContent";
import { pageSeoDefaults } from "@/config/seo";
import { getProjectService } from "@/server/services";

export function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("projects", {
    title: pageSeoDefaults.projects.title,
    description: pageSeoDefaults.projects.description,
    alternates: { canonical: siteUrl("/projects") },
  });
}

export default async function ProjectsPage() {
  // Featured projects lead the list, in the same order as the home carousel.
  const result = await getProjectService().getAll({ pageSize: 100, order: "featuredFirst" });
  const projects: ProjectCardData[] = result.ok
    ? result.value.items.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        summary: p.summary,
        coverImage: p.coverImage,
        technologies: p.technologies,
        featured: p.featured,
        publishedAt: p.publishedAt.toISOString(),
      }))
    : [];

  return (
    <>
      <PageShell
        eyebrow="Portfolio"
        title="Projects"
        description="A collection of work that spans full-stack web apps, cloud architecture, and developer tools."
      >
        <section aria-label="All projects">
          {result.ok ? (
            <ProjectExplorer projects={projects} />
          ) : (
            <Alert tone="danger" title="Projects couldn't be loaded">
              Please refresh the page in a moment.
            </Alert>
          )}
        </section>
      </PageShell>
      <CtaBand />
    </>
  );
}
