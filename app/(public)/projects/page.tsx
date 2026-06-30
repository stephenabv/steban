import type { Metadata } from "next";
import { ProjectGrid } from "@/features/projects/ProjectGrid";
import { siteConfig } from "@/config/site";
import styles from "./projects.module.less";

export const metadata: Metadata = {
  title: "Projects",
  description: `A showcase of software projects built by ${siteConfig.name}.`,
  alternates: { canonical: `${siteConfig.url}/projects` },
};

// TODO: fetch from ProjectService when DB is wired up
const projects: never[] = [];

export default function ProjectsPage() {
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
