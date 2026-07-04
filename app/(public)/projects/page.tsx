import type { Metadata } from "next";
import { ProjectGrid } from "@/features/projects/ProjectGrid";
import { siteConfig } from "@/config/site";
import { getProjectService } from "@/server/services";
import styles from "./projects.module.less";

export const metadata: Metadata = {
  title: "Projects",
  description: `A showcase of software projects built by ${siteConfig.name}.`,
  alternates: { canonical: `${siteConfig.url}/projects` },
};

export default async function ProjectsPage() {
  const result = await getProjectService().getAll({ pageSize: 100 });
  const projects = result.ok ? result.value.items : [];
  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="projects-heading">
        <h1 id="projects-heading" className={styles.heading}>
          Projects
        </h1>
        <p className={styles.subheading}>
          A collection of work that spans full-stack web apps, cloud architecture, and developer
          tools.
        </p>
      </section>

      <section className={styles.grid} aria-label="All projects">
        <ProjectGrid projects={projects} />
      </section>
    </div>
  );
}
