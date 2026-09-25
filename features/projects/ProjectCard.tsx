import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/icons/Icon";
import type { ProjectCardData } from "./types";
import styles from "./ProjectGrid.module.less";

const MAX_TECH = 4;

export function ProjectCard({ project, priority = false }: { project: ProjectCardData; priority?: boolean }) {
  const extraTech = project.technologies.length - MAX_TECH;

  return (
    <article className={styles.card}>
      <div className={styles.media}>
        {project.coverImage ? (
          <Image
            src={project.coverImage}
            alt=""
            fill
            priority={priority}
            className={styles.image}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
          />
        ) : (
          <div className={styles.placeholder} aria-hidden="true">
            <Icon name="code" size={32} strokeWidth={1.5} />
          </div>
        )}
        {project.featured && (
          <Badge tone="accent" className={styles.featured}>
            <Icon name="star" size={12} />
            Featured
          </Badge>
        )}
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>
          {/* Stretched link: the whole card is the click target, one tab stop. */}
          <Link href={`/projects/${project.slug}`} className={styles.link}>
            {project.title}
          </Link>
        </h3>
        {project.summary && <p className={styles.summary}>{project.summary}</p>}

        {project.technologies.length > 0 && (
          <ul className={styles.techs} role="list" aria-label="Technologies">
            {project.technologies.slice(0, MAX_TECH).map((t) => (
              <li key={t} className={styles.tech}>
                {t}
              </li>
            ))}
            {extraTech > 0 && (
              <li className={styles.tech} aria-label={`and ${extraTech} more`}>
                +{extraTech}
              </li>
            )}
          </ul>
        )}

        <span className={styles.more} aria-hidden="true">
          View details <Icon name="arrow-right" size={14} />
        </span>
      </div>
    </article>
  );
}
