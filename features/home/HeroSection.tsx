"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { Hero } from "@/server/domain/entities";
import { siteConfig } from "@/config/site";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/icons/Icon";
import { EASE_OUT, fadeUp } from "@/lib/motion";
import { initials } from "@/lib/initials";
import styles from "./HeroSection.module.less";

interface Props {
  hero: Hero | null;
  /** Versioned URL of the uploaded profile photo; initials are shown without one. */
  photoSrc: string | null;
  /** Whether an uploaded resume is published; the button is hidden otherwise. */
  resumeAvailable: boolean;
  /** Anchor id of the section the scroll cue should jump to. */
  nextSectionId?: string;
}

const DEFAULT_INTRO =
  "Building scalable, high-performance web applications with a focus on clean architecture, security, and exceptional developer experience.";

export function HeroSection({ hero, photoSrc, resumeAvailable, nextSectionId }: Props) {
  const name = hero?.name || siteConfig.name;

  // Stagger children in sequence (reduced motion is handled by MotionConfig).
  const item = (i: number) => fadeUp(i * 0.1);

  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.grid} />
        <div className={styles.glowA} />
        <div className={styles.glowB} />
      </div>

      <div className={styles.inner}>
        <motion.div className={styles.content} initial="hidden" animate="visible">
          <motion.div variants={item(0)}>
            <Badge tone="success" pulse>
              Available for opportunities
            </Badge>
          </motion.div>

          <motion.h1 id="hero-heading" variants={item(1)} className={styles.name}>
            {name}
          </motion.h1>

          <motion.p variants={item(2)} className={styles.title}>
            {hero?.title || "Computer Engineer"}
          </motion.p>

          <motion.p variants={item(3)} className={styles.intro}>
            {hero?.introduction || DEFAULT_INTRO}
          </motion.p>

          <motion.div variants={item(4)} className={styles.actions}>
            <Button href="/projects" size="lg" iconRight="arrow-right">
              View Projects
            </Button>
            <Button href="/contact" size="lg" variant="secondary">
              Contact Me
            </Button>
            {resumeAvailable && (
              <Button
                href={siteConfig.resumePath}
                size="lg"
                variant="ghost"
                icon="download"
                external // plain <a>: a Next <Link> would prefetch the PDF route
                aria-label="View resume (PDF, opens in new tab)"
              >
                Resume
              </Button>
            )}
          </motion.div>
        </motion.div>

        <motion.div
          className={styles.photoWrapper}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1, transition: { duration: 0.8, delay: 0.2, ease: EASE_OUT } }}
        >
          <div className={styles.photoFrame}>
            {photoSrc ? (
              <Image
                src={photoSrc}
                alt={hero?.photoAlt || `${name} — profile photo`}
                fill
                className={styles.photo}
                priority
                sizes="(max-width: 1024px) 70vw, 420px"
              />
            ) : (
              <div className={styles.photoPlaceholder} role="img" aria-label={`${name} initials`}>
                {initials(name)}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {nextSectionId && (
        <a href={`#${nextSectionId}`} className={styles.scrollCue}>
          <span>Selected work</span>
          <Icon name="arrow-down" size={16} />
        </a>
      )}
    </section>
  );
}
