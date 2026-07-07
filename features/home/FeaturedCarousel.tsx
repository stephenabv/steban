"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { BezierDefinition } from "framer-motion";
import type { Project } from "@/server/domain/entities";
import styles from "./FeaturedCarousel.module.less";

const AUTO_PLAY_INTERVAL = 5000;
const EASE: BezierDefinition = [0.22, 1, 0.36, 1];

interface Props {
  projects: Project[];
}

export function FeaturedCarousel({ projects }: Props) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = useCallback(
    (next: number) => {
      setDirection(next > index ? 1 : -1);
      setIndex(next);
    },
    [index]
  );

  const prev = useCallback(() => go((index - 1 + projects.length) % projects.length), [go, index, projects.length]);
  const next = useCallback(() => go((index + 1) % projects.length), [go, index, projects.length]);

  useEffect(() => {
    if (paused || projects.length <= 1) return;
    timerRef.current = setInterval(next, AUTO_PLAY_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, next, projects.length]);

  if (projects.length === 0) return null;

  const project = projects[index];

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.5, ease: EASE } },
    exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0, transition: { duration: 0.4 } }),
  };

  return (
    <section
      className={styles.section}
      aria-label="Featured projects"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Selected Work</p>
          <h2 className={styles.heading}>Featured Projects</h2>
        </div>
        <Link href="/projects" className={styles.viewAll} aria-label="View all projects">
          All Projects{" "}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className={styles.track} aria-live="polite" aria-atomic="true">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={project.id}
            className={styles.slide}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <article className={styles.card}>
              <div className={styles.cardImage}>
                {project.coverImage ? (
                  <Image
                    src={project.coverImage}
                    alt={project.title}
                    fill
                    style={{ objectFit: "contain" }}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                ) : (
                  <div className={styles.cardImagePlaceholder} aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="m21 15-5-5L5 21" />
                    </svg>
                  </div>
                )}
              </div>
              <div className={styles.cardBody}>
                <p className={styles.cardLabel}>Featured Project</p>
                <h3 className={styles.cardTitle}>{project.title}</h3>
                <p className={styles.cardSummary}>{project.summary}</p>
                <ul className={styles.techList} role="list" aria-label="Technologies used">
                  {project.technologies.slice(0, 6).map((tech) => (
                    <li key={tech} className={styles.techBadge}>
                      {tech}
                    </li>
                  ))}
                </ul>
                <div className={styles.cardLinks}>
                  <Link href={`/projects/${project.slug}`} className={styles.cardLinkPrimary}>
                    View Details
                  </Link>
                  {project.githubUrl && (
                    <Link
                      href={project.githubUrl}
                      className={styles.cardLinkOutline}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`View ${project.title} on GitHub`}
                    >
                      GitHub
                    </Link>
                  )}
                  {project.liveUrl && (
                    <Link
                      href={project.liveUrl}
                      className={styles.cardLinkOutline}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`View ${project.title} live demo`}
                    >
                      Live Demo
                    </Link>
                  )}
                </div>
              </div>
            </article>
          </motion.div>
        </AnimatePresence>
      </div>

      {projects.length > 1 && (
        <div className={styles.controls}>
          <button
            className={styles.arrowBtn}
            onClick={prev}
            aria-label="Previous project"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className={styles.dots} role="tablist" aria-label="Project slides">
            {projects.map((p, i) => (
              <button
                key={p.id}
                className={`${styles.dot} ${i === index ? styles.active : ""}`}
                role="tab"
                aria-selected={i === index}
                aria-label={`Go to project ${i + 1}: ${p.title}`}
                onClick={() => go(i)}
              />
            ))}
          </div>

          <button
            className={styles.arrowBtn}
            onClick={next}
            aria-label="Next project"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}
