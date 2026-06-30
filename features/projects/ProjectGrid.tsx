import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/server/domain/entities";
import styles from "./ProjectGrid.module.less";

interface Props {
  projects: Project[];
}

export function ProjectGrid({ projects }: Props) {
  if (projects.length === 0) {
    return (
      <div className={styles.grid}>
        <p className={styles.empty}>No projects found.</p>
      </div>
    );
  }

  return (
    <ul className={styles.grid} role="list">
      {projects.map((project) => (
        <li key={project.id}>
          <article className={styles.card}>
            <div className={styles.image}>
              {project.coverImage ? (
                <Image
                  src={project.coverImage}
                  alt={project.title}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                />
              ) : (
                <div className={styles.imagePlaceholder} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                </div>
              )}
            </div>
            <div className={styles.body}>
              <h3 className={styles.title}>{project.title}</h3>
              <p className={styles.summary}>{project.summary}</p>
              <ul className={styles.techs} aria-label="Technologies">
                {project.technologies.slice(0, 5).map((t) => (
                  <li key={t} className={styles.tech}>
                    {t}
                  </li>
                ))}
              </ul>
              <Link
                href={`/projects/${project.slug}`}
                className={styles.link}
                aria-label={`View details for ${project.title}`}
              >
                View Details{" "}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
