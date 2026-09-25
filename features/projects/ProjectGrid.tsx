import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProjectCard } from "./ProjectCard";
import type { ProjectCardData } from "./types";
import styles from "./ProjectGrid.module.less";

interface Props {
  projects: ProjectCardData[];
  emptyAction?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function ProjectGrid({
  projects,
  emptyAction,
  emptyTitle = "No projects yet",
  emptyDescription = "New work is on the way — check back soon.",
}: Props) {
  if (projects.length === 0) {
    return <EmptyState icon="layers" title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  return (
    <ul className={styles.grid} role="list">
      {projects.map((project, i) => (
        // Stagger only the first row; later cards reveal as they scroll in.
        <Reveal as="li" key={project.id} delay={Math.min(i, 4) * 0.06}>
          <ProjectCard project={project} priority={i < 2} />
        </Reveal>
      ))}
    </ul>
  );
}
