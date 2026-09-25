import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { siteUrl } from "@/config/site";
import type { Project } from "@/server/domain/entities";
import { getProjectService } from "@/server/services";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/icons/Icon";
import { CtaBand } from "@/features/shared/CtaBand";
import styles from "./projectDetail.module.less";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProject(slug: string): Promise<Project | null> {
  const result = await getProjectService().getBySlug(slug);
  return result.ok ? result.value : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: "Project Not Found" };
  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical: siteUrl(`/projects/${slug}`) },
    openGraph: {
      title: project.title,
      description: project.summary,
      images: project.coverImage ? [{ url: project.coverImage }] : [],
    },
  };
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) notFound();

  return (
    <>
      <article className={styles.page}>
        <header className={styles.header}>
          <div className={styles.glow} aria-hidden="true" />
          <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
            <ol role="list">
              <li>
                <Link href="/projects">
                  <Icon name="arrow-left" size={14} />
                  Projects
                </Link>
              </li>
              <li aria-current="page">{project.title}</li>
            </ol>
          </nav>

          <div className={styles.headerText}>
            {project.featured && (
              <Badge tone="accent">
                <Icon name="star" size={12} />
                Featured project
              </Badge>
            )}
            <h1 className={styles.title}>{project.title}</h1>
            {project.summary && <p className={styles.summary}>{project.summary}</p>}

            {(project.liveUrl || project.githubUrl) && (
              <div className={styles.links}>
                {project.liveUrl && (
                  <Button href={project.liveUrl} size="lg" icon="external">
                    Live demo
                  </Button>
                )}
                {project.githubUrl && (
                  <Button href={project.githubUrl} size="lg" variant="secondary" icon="github">
                    View on GitHub
                  </Button>
                )}
              </div>
            )}
          </div>
        </header>

        {project.coverImage && (
          <div className={styles.coverWrap}>
            <Reveal className={styles.cover}>
              <Image
                src={project.coverImage}
                alt={`${project.title} — cover image`}
                fill
                priority
                className={styles.coverImage}
                sizes="(max-width: 1280px) 100vw, 1216px"
              />
            </Reveal>
          </div>
        )}

        <div className={styles.body}>
          <div className={styles.main}>
            <section aria-labelledby="desc-heading">
              <h2 id="desc-heading" className={styles.sectionHeading}>
                About the project
              </h2>
              {project.description ? (
                <p className={styles.description}>{project.description}</p>
              ) : (
                <p className={styles.muted}>A detailed write-up is coming soon.</p>
              )}
            </section>

            {project.features.length > 0 && (
              <section aria-labelledby="features-heading">
                <h2 id="features-heading" className={styles.sectionHeading}>
                  Key features
                </h2>
                <ul className={styles.featureList} role="list">
                  {project.features.map((f) => (
                    <li key={f} className={styles.featureItem}>
                      <span className={styles.featureIcon} aria-hidden="true">
                        <Icon name="check" size={14} strokeWidth={2.5} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {project.gallery.length > 0 && (
              <section aria-labelledby="gallery-heading">
                <h2 id="gallery-heading" className={styles.sectionHeading}>
                  Gallery
                </h2>
                <ul className={styles.gallery} role="list">
                  {project.gallery.map((src, i) => (
                    <li key={src} className={styles.galleryItem}>
                      <a
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.galleryLink}
                      >
                        <Image
                          src={src}
                          alt={`${project.title} screenshot ${i + 1}`}
                          fill
                          className={styles.galleryImage}
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                        <span className="sr-only">(opens full size in a new tab)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className={styles.sidebar} aria-label="Project details">
            <div className={styles.sideCard}>
              {project.technologies.length > 0 && (
                <section aria-labelledby="tech-heading">
                  <h2 id="tech-heading" className={styles.sidebarHeading}>
                    Technologies
                  </h2>
                  <ul className={styles.techList} role="list">
                    {project.technologies.map((t) => (
                      <li key={t} className={styles.techBadge}>
                        {t}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <dl className={styles.meta}>
                <div>
                  <dt className={styles.sidebarHeading}>Published</dt>
                  <dd className={styles.metaValue}>
                    <time dateTime={project.publishedAt.toISOString()}>
                      {dateFormatter.format(project.publishedAt)}
                    </time>
                  </dd>
                </div>
                {(project.liveUrl || project.githubUrl) && (
                  <div>
                    <dt className={styles.sidebarHeading}>Links</dt>
                    <dd className={styles.metaLinks}>
                      {project.liveUrl && (
                        <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                          <Icon name="globe" size={14} /> Live site
                        </a>
                      )}
                      {project.githubUrl && (
                        <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                          <Icon name="github" size={14} /> Source code
                        </a>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <Button href="/projects" variant="ghost" icon="arrow-left" fullWidth>
              All projects
            </Button>
          </aside>
        </div>
      </article>
      <CtaBand title="Like what you see?" />
    </>
  );
}
