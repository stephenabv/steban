import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { ProjectGrid } from "@/features/projects/ProjectGrid";
import type { ProjectCardData } from "@/features/projects/types";
import styles from "./FeaturedProjects.module.less";

interface Props {
  projects: ProjectCardData[];
}

/**
 * The featured projects on the home page, in the same HUD card used on the
 * Projects page, so a project looks the same wherever it appears.
 */
export function FeaturedProjects({ projects }: Props) {
  return (
    <section id="featured" className={styles.section} aria-labelledby="featured-heading">
      <SectionHeading
        id="featured-heading"
        eyebrow="Selected work"
        title="Featured projects"
        className={styles.heading}
        actions={
          <Button href="/projects" variant="link" iconRight="chevron-right">
            See all projects
          </Button>
        }
      />
      <ProjectGrid
        projects={projects}
        compact
        emptyTitle="New projects are on the way"
        emptyDescription="Featured work will appear here soon."
        emptyAction={
          <Button href="/projects" variant="secondary">
            Browse all projects
          </Button>
        }
      />
    </section>
  );
}
