import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/server/domain/entities";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/icons/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { Logo } from "@/components/layout/Logo";
import styles from "./FeaturedFeed.module.less";

const MAX_TECH = 6;

/** The feed column is at most ~700px wide; phones get a full-width rendition. */
const COVER_SIZES = "(max-width: 767px) 100vw, (max-width: 1099px) 60vw, 700px";

const postDate = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

interface Props {
  projects: Project[];
  id?: string;
}

interface PostAction {
  href: string;
  label: string;
  icon: IconName;
  /** Accessible name; the visible label alone is ambiguous across posts. */
  ariaLabel: string;
  external?: boolean;
}

function actionsFor(project: Project): PostAction[] {
  return [
    {
      href: `/projects/${project.slug}`,
      label: "Case study",
      icon: "file-text",
      ariaLabel: `${project.title}: case study`,
    },
    ...(project.liveUrl
      ? [
          {
            href: project.liveUrl,
            label: "Live site",
            icon: "external" as const,
            ariaLabel: `${project.title}: live site (opens in new tab)`,
            external: true,
          },
        ]
      : []),
    ...(project.githubUrl
      ? [
          {
            href: project.githubUrl,
            label: "Source",
            icon: "code" as const,
            ariaLabel: `${project.title}: source code (opens in new tab)`,
            external: true,
          },
        ]
      : []),
  ];
}

/**
 * Featured projects as a Facebook-style feed of posts. A server component: no
 * client JavaScript, autoplay or drag handlers, so it adds nothing to the
 * hydration cost or input latency of the home page.
 */
export function FeaturedFeed({ projects, id }: Props) {
  return (
    <section id={id} className={styles.feed} aria-labelledby="featured-heading">
      <div className={styles.heading}>
        <h2 id="featured-heading">Featured work</h2>
        <Button href="/projects" variant="link">
          See all projects
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className={styles.empty}>
          <Icon name="layers" size={28} />
          <p>New projects are on the way.</p>
          <Button href="/projects" variant="secondary">
            Browse all projects
          </Button>
        </div>
      ) : (
        <ul className={styles.posts} role="list">
          {projects.map((project) => (
            <Reveal as="li" key={project.id}>
              <Post project={project} />
            </Reveal>
          ))}
        </ul>
      )}
    </section>
  );
}

function Post({ project }: { project: Project }) {
  const actions = actionsFor(project);
  const href = `/projects/${project.slug}`;

  return (
    <article className={styles.post} aria-labelledby={`post-${project.id}`}>
      <header className={styles.author}>
        <Logo size={40} decorative />
        <div>
          <p className={styles.authorName}>{siteConfig.name}</p>
          <p className={styles.meta}>
            Featured project ·{" "}
            <time dateTime={project.publishedAt.toISOString()}>
              {postDate.format(project.publishedAt)}
            </time>
          </p>
        </div>
      </header>

      <div className={styles.text}>
        <h3 id={`post-${project.id}`} className={styles.title}>
          <Link href={href}>{project.title}</Link>
        </h3>
        {project.summary && <p className={styles.summary}>{project.summary}</p>}
      </div>

      {/* Same destination as the title, so it is hidden from the tab order and AT. */}
      <Link href={href} className={styles.media} tabIndex={-1} aria-hidden="true">
        {project.coverImage ? (
          <Image
            src={project.coverImage}
            alt=""
            fill
            className={styles.image}
            sizes={COVER_SIZES}
          />
        ) : (
          <span className={styles.placeholder}>
            <Icon name="image" size={40} strokeWidth={1.25} />
          </span>
        )}
      </Link>

      {project.technologies.length > 0 && (
        <ul className={styles.techs} role="list" aria-label="Technologies used">
          {project.technologies.slice(0, MAX_TECH).map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>
      )}

      <div className={styles.actions} data-count={actions.length}>
        {actions.map((action) =>
          action.external ? (
            <a
              key={action.label}
              href={action.href}
              className={styles.action}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={action.ariaLabel}
            >
              <Icon name={action.icon} size={18} />
              {action.label}
            </a>
          ) : (
            <Link
              key={action.label}
              href={action.href}
              className={styles.action}
              aria-label={action.ariaLabel}
            >
              <Icon name={action.icon} size={18} />
              {action.label}
            </Link>
          )
        )}
      </div>
    </article>
  );
}
