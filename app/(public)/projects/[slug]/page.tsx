import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import type { Project } from "@/server/domain/entities";
import { getProjectService } from "@/server/services";
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
    alternates: { canonical: `${siteConfig.url}/projects/${slug}` },
    openGraph: {
      title: project.title,
      description: project.summary,
      images: project.coverImage ? [{ url: project.coverImage }] : [],
    },
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) notFound();

  return (
    <article className={styles.page}>
      <div className={styles.header}>
        <Link href="/projects" className={styles.back} aria-label="Back to all projects">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          All Projects
        </Link>
        <h1 className={styles.title}>{project.title}</h1>
        <p className={styles.summary}>{project.summary}</p>

        <div className={styles.links}>
          {project.liveUrl && (
            <Link href={project.liveUrl} className={styles.btnPrimary} target="_blank" rel="noopener noreferrer">
              Live Demo
            </Link>
          )}
          {project.githubUrl && (
            <Link href={project.githubUrl} className={styles.btnOutline} target="_blank" rel="noopener noreferrer">
              View on GitHub
            </Link>
          )}
        </div>
      </div>

      {project.coverImage && (
        <div className={styles.cover}>
          <Image
            src={project.coverImage}
            alt={project.title}
            fill
            style={{ objectFit: "cover" }}
            priority
            sizes="100vw"
          />
        </div>
      )}

      <div className={styles.body}>
        <div className={styles.main}>
          <section aria-labelledby="desc-heading">
            <h2 id="desc-heading" className={styles.sectionHeading}>About the Project</h2>
            <p className={styles.description}>{project.description}</p>
          </section>

          {project.features.length > 0 && (
            <section aria-labelledby="features-heading">
              <h2 id="features-heading" className={styles.sectionHeading}>Key Features</h2>
              <ul className={styles.featureList}>
                {project.features.map((f) => (
                  <li key={f} className={styles.featureItem}>
                    <span aria-hidden="true">✦</span> {f}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {project.gallery.length > 0 && (
            <section aria-labelledby="gallery-heading">
              <h2 id="gallery-heading" className={styles.sectionHeading}>Gallery</h2>
              <div className={styles.gallery}>
                {project.gallery.map((src, i) => (
                  <div key={src} className={styles.galleryItem}>
                    <Image
                      src={src}
                      alt={`${project.title} screenshot ${i + 1}`}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className={styles.sidebar}>
          <section aria-labelledby="tech-heading">
            <h2 id="tech-heading" className={styles.sidebarHeading}>Technologies</h2>
            <ul className={styles.techList}>
              {project.technologies.map((t) => (
                <li key={t} className={styles.techBadge}>{t}</li>
              ))}
            </ul>
          </section>

          <div className={styles.meta}>
            <div>
              <dt className={styles.metaLabel}>Published</dt>
              <dd className={styles.metaValue}>
                {new Date(project.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </dd>
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}
