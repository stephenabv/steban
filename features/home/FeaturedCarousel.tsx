"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { PanInfo } from "framer-motion";
import type { Project } from "@/server/domain/entities";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/icons/Icon";
import { EASE_OUT } from "@/lib/motion";
import { useIsClient } from "@/lib/hooks/useIsClient";
import { cn } from "@/lib/cn";
import styles from "./FeaturedCarousel.module.less";

const AUTO_PLAY_MS = 6000;
/** Horizontal drag (px) or flick velocity needed to change slides. */
const SWIPE_DISTANCE = 80;
const SWIPE_VELOCITY = 400;

interface Props {
  projects: Project[];
  id?: string;
}

export function FeaturedCarousel({ projects, id }: Props) {
  const reduceMotion = useReducedMotion();
  const isClient = useIsClient();
  const [[index, direction], setSlide] = useState<[number, number]>([0, 1]);
  const [paused, setPaused] = useState(false);
  const count = projects.length;

  const go = useCallback(
    (next: number, dir?: number) => {
      setSlide(([current]) => [((next % count) + count) % count, dir ?? (next > current ? 1 : -1)]);
    },
    [count]
  );
  const next = useCallback(() => setSlide(([i]) => [(i + 1) % count, 1]), [count]);
  const prev = useCallback(() => setSlide(([i]) => [(i - 1 + count) % count, -1]), [count]);

  // Autoplay is off for reduced-motion users (WCAG 2.2.2 pause/stop/hide). It is
  // client-only so the server and hydration renders agree.
  const autoplay = isClient && !paused && !reduceMotion && count > 1;

  useEffect(() => {
    if (!autoplay) return;
    const timer = setTimeout(next, AUTO_PLAY_MS);
    return () => clearTimeout(timer);
  }, [autoplay, next, index]);

  if (count === 0) return null;

  const project = projects[index];

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) next();
    else if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY) prev();
  }

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.5, ease: EASE_OUT } },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0, transition: { duration: 0.25 } }),
  };

  return (
    <section
      id={id}
      className={styles.section}
      aria-roledescription="carousel"
      aria-labelledby="featured-heading"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <SectionHeading
        id="featured-heading"
        eyebrow="Selected work"
        title="Featured projects"
        description="A few builds I'm proud of — from architecture decisions to the final pixel."
        className={styles.header}
        actions={
          <Button href="/projects" variant="link" iconRight="arrow-right">
            All projects
          </Button>
        }
      />

      <div className={styles.stage}>
        <AnimatePresence custom={direction} mode="wait" initial={false}>
          <motion.article
            key={project.id}
            className={styles.card}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            drag={count > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={onDragEnd}
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${count}: ${project.title}`}
          >
            <div className={styles.media}>
              {project.coverImage ? (
                <Image
                  src={project.coverImage}
                  alt=""
                  fill
                  draggable={false}
                  className={styles.image}
                  sizes="(max-width: 1024px) 100vw, 55vw"
                />
              ) : (
                <div className={styles.placeholder} aria-hidden="true">
                  <Icon name="image" size={48} strokeWidth={1.25} />
                </div>
              )}
            </div>

            <div className={styles.body}>
              <p className={styles.counter} aria-hidden="true">
                <span>{String(index + 1).padStart(2, "0")}</span> / {String(count).padStart(2, "0")}
              </p>
              <h3 className={styles.title}>
                <Link href={`/projects/${project.slug}`} className={styles.titleLink} draggable={false}>
                  {project.title}
                </Link>
              </h3>
              <p className={styles.summary}>{project.summary}</p>
              {project.technologies.length > 0 && (
                <ul className={styles.techList} role="list" aria-label="Technologies used">
                  {project.technologies.slice(0, 6).map((tech) => (
                    <li key={tech} className={styles.tech}>
                      {tech}
                    </li>
                  ))}
                </ul>
              )}
              <div className={styles.links}>
                <Button href={`/projects/${project.slug}`} iconRight="arrow-right" draggable={false}>
                  View case study
                </Button>
                {project.liveUrl && (
                  <Button
                    href={project.liveUrl}
                    variant="secondary"
                    icon="external"
                    aria-label={`${project.title} live demo (opens in new tab)`}
                  >
                    Live demo
                  </Button>
                )}
                {project.githubUrl && (
                  <Button
                    href={project.githubUrl}
                    variant="ghost"
                    icon="github"
                    aria-label={`${project.title} on GitHub (opens in new tab)`}
                  >
                    Code
                  </Button>
                )}
              </div>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>

      {count > 1 && (
        <div className={styles.controls}>
          <button type="button" className={styles.arrowBtn} onClick={prev} aria-label="Previous project">
            <Icon name="chevron-left" size={18} />
          </button>

          <div className={styles.dots} role="group" aria-label="Choose a project">
            {projects.map((p, i) => (
              <button
                key={p.id}
                type="button"
                className={cn(styles.dot, i === index && styles.dotActive)}
                aria-label={`Show project ${i + 1}: ${p.title}`}
                aria-current={i === index ? "true" : undefined}
                onClick={() => go(i)}
              >
                {i === index && autoplay && (
                  <span
                    key={`${index}-progress`}
                    className={styles.dotProgress}
                    style={{ animationDuration: `${AUTO_PLAY_MS}ms` }}
                    aria-hidden="true"
                  />
                )}
              </button>
            ))}
          </div>

          <button type="button" className={styles.arrowBtn} onClick={next} aria-label="Next project">
            <Icon name="chevron-right" size={18} />
          </button>

          <p className="sr-only" aria-live="polite">
            Showing project {index + 1} of {count}: {project.title}
          </p>
        </div>
      )}
    </section>
  );
}
