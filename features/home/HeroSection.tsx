import Image from "next/image";
import type { Hero } from "@/server/domain/entities";
import { siteConfig } from "@/config/site";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/icons/Icon";
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

/**
 * The photo frame is 240px wide (60vw on narrow phones) below the `lg`
 * breakpoint and 400px from it — keep in sync with `.photoFrame`. An accurate
 * hint stops phones from downloading a desktop-sized rendition.
 */
const PHOTO_SIZES = "(max-width: 1023px) min(240px, 60vw), 400px";

const DEFAULT_INTRO =
  "Building scalable, high-performance web applications with a focus on clean architecture, security, and exceptional developer experience.";

export function HeroSection({ hero, photoSrc, resumeAvailable, nextSectionId }: Props) {
  const name = hero?.name || siteConfig.name;

  // Rendered on the server with CSS-only entrance animations: the copy and the
  // photo paint with the first HTML instead of waiting for hydration, which
  // is what kept Largest Contentful Paint late on mobile.
  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.grid} />
      </div>

      <div className={styles.inner}>
        <div className={styles.content}>
          <div>
            <Badge tone="success" pulse>
              Available for opportunities
            </Badge>
          </div>

          <h1 id="hero-heading" className={styles.name}>
            {name}
          </h1>

          <p className={styles.title}>
            {hero?.title || "Computer Engineer"}
          </p>

          <p className={styles.intro}>
            {hero?.introduction || DEFAULT_INTRO}
          </p>

          <div className={styles.actions}>
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
          </div>
        </div>

        <div className={styles.photoWrapper}>
          <div className={styles.photoFrame}>
            {photoSrc ? (
              <Image
                src={photoSrc}
                alt={hero?.photoAlt || `${name} — profile photo`}
                fill
                className={styles.photo}
                // The LCP element on phones: fetch it first, never lazily.
                loading="eager"
                fetchPriority="high"
                sizes={PHOTO_SIZES}
              />
            ) : (
              <div className={styles.photoPlaceholder} role="img" aria-label={`${name} initials`}>
                {initials(name)}
              </div>
            )}
          </div>
        </div>
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
