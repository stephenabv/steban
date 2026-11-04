import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";
import { ProjectCard } from "./ProjectCard";
import type { ProjectCardData } from "./types";
import styles from "./ProjectGrid.module.less";

interface Props {
  projects: ProjectCardData[];
  emptyAction?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Three columns at most (home), instead of four on very wide screens. */
  compact?: boolean;
}

export function ProjectGrid({
  projects,
  emptyAction,
  emptyTitle = "No projects yet",
  emptyDescription = "New work is on the way — check back soon.",
  compact = false,
}: Props) {
  if (projects.length === 0) {
    return <EmptyState icon="layers" title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  return (
    <ul className={cn(styles.grid, compact && styles.compact)} role="list">
      {projects.map((project, i) => (
        // Stagger only the first row; later cards reveal as they scroll in.
        <Reveal as="li" key={project.id} delay={Math.min(i, 4) * 0.06}>
          <ProjectCard project={project} index={i + 1} priority={i < 2} />
        </Reveal>
      ))}
    </ul>
  );
}
