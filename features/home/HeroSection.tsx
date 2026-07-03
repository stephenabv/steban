"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { BezierDefinition } from "framer-motion";
import type { Hero } from "@/server/domain/entities";
import { siteConfig } from "@/config/site";
import styles from "./HeroSection.module.less";

const EASE: BezierDefinition = [0.22, 1, 0.36, 1];

function fadeUpVariants(i: number) {
  return {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay: i * 0.12, ease: EASE },
    },
  };
}

interface Props {
  hero: Hero | null;
}

export function HeroSection({ hero }: Props) {
  const initials = siteConfig.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <section className={styles.hero} aria-label="Introduction">
      <div className={styles.inner}>
        <div className={styles.content}>
          <motion.div initial="hidden" animate="visible" variants={fadeUpVariants(0)}>
            <span className={styles.badge}>
              <span aria-hidden="true">●</span> Available for opportunities
            </span>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants(1)}
            className={styles.name}
          >
            {hero?.name ?? siteConfig.name}
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants(2)}
            className={styles.title}
          >
            {hero?.title ?? "Computer Engineer"}
          </motion.p>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants(3)}
            className={styles.intro}
          >
            {hero?.introduction ??
              "Building scalable, high-performance web applications with a focus on clean architecture, security, and exceptional developer experience."}
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants(4)}
            className={styles.actions}
          >
            <Link href="/projects" className={styles.btnPrimary}>
              View Projects
            </Link>
            <Link href="/contact" className={styles.btnOutline}>
              Contact Me
            </Link>
            <Link
              href={hero?.resumeUrl ?? siteConfig.resumeUrl}
              className={styles.btnOutline}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Download resume (opens in new tab)"
            >
              Download Resume
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUpVariants(2)}
          className={styles.photoWrapper}
        >
          <div className={styles.photoContainer}>
            {hero?.photoUrl ? (
              <Image
                src={hero.photoUrl}
                alt={hero.photoAlt || `${siteConfig.name} — profile photo`}
                fill
                className={styles.photo}
                priority
                sizes="(max-width: 1024px) 90vw, 380px"
              />
            ) : (
              <div className={styles.photoPlaceholder} aria-label={`${siteConfig.name} initials`}>
                {initials}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className={styles.scrollIndicator} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </section>
  );
}
