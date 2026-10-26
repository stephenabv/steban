import Image from "next/image";
import type { Hero } from "@/server/domain/entities";
import { siteConfig } from "@/config/site";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { initials } from "@/lib/initials";
import styles from "./HeroSection.module.less";

interface Props {
  hero: Hero | null;
  /** Versioned URL of the uploaded profile photo; initials are shown without one. */
  photoSrc: string | null;
  /** Whether an uploaded resume is published; the button is hidden otherwise. */
  resumeAvailable: boolean;
}

/**
 * The avatar is 112px across below the `lg` breakpoint and 152px from it
 * (the story ring and its gap sit outside) — keep in sync with `.avatar`.
 * An accurate hint stops phones from downloading a desktop-sized rendition.
 */
const PHOTO_SIZES = "(max-width: 1023px) 112px, 152px";

const DEFAULT_INTRO =
  "Building scalable, high-performance web applications with a focus on clean architecture, security, and exceptional developer experience.";

/**
 * Profile header in the Facebook/Instagram idiom: a cover, a round photo in a
 * story ring, the name, the introduction and the two actions only the hero
 * offers (contact, resume). Projects are reached from the feed right below it
 * and from the navbar, so the hero does not link to them again.
 *
 * Rendered on the server with CSS-only, transform-only entrance animations: the
 * copy and the photo paint at full opacity with the first HTML, so Largest
 * Contentful Paint never waits for hydration or a fade.
 */
export function HeroSection({ hero, photoSrc, resumeAvailable }: Props) {
  const name = hero?.name || siteConfig.name;

  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      <div className={styles.profile}>
        <div className={styles.cover} aria-hidden="true" />

        <div className={styles.header}>
          <div className={styles.ring}>
            <div className={styles.avatar}>
              {photoSrc ? (
                <Image
                  src={photoSrc}
                  alt={hero?.photoAlt || `${name} — profile photo`}
                  fill
                  className={styles.photo}
                  // Above the fold on every screen: fetch it first, never lazily.
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

          <div className={styles.identity}>
            <div>
              <Badge tone="success" pulse>
                Available for opportunities
              </Badge>
            </div>
            <h1 id="hero-heading" className={styles.name}>
              {name}
            </h1>
            <p className={styles.title}>{hero?.title || "Computer Engineer"}</p>
          </div>

          <div className={styles.actions}>
            <Button href="/contact" iconRight="arrow-right">
              Contact Me
            </Button>
            {resumeAvailable && (
              <Button
                href={siteConfig.resumePath}
                variant="secondary"
                icon="download"
                external // plain <a>: a Next <Link> would prefetch the PDF route
                aria-label="View resume (PDF, opens in new tab)"
              >
                Resume
              </Button>
            )}
          </div>
        </div>

        <p className={styles.intro}>{hero?.introduction || DEFAULT_INTRO}</p>

      </div>
    </section>
  );
}
