import Image from "next/image";
import type { Hero } from "@/server/domain/entities";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/Button";
import { initials } from "@/lib/initials";
import { formatReadout, litCells, type Readout } from "@/lib/home/readouts";
import styles from "./HeroSection.module.less";

interface Props {
  hero: Hero | null;
  /** Versioned URL of the uploaded profile photo; initials are shown without one. */
  photoSrc: string | null;
  /** Whether an uploaded resume is published; the button is hidden otherwise. */
  resumeAvailable: boolean;
  /** Numbers derived from the site's content (lib/home/readouts). */
  readouts: Readout[];
}

/**
 * The photo is 140px across below `md` and 240px from it, inside the ring
 * gauge — keep in sync with `.photo` in the stylesheet. An accurate hint stops
 * phones from downloading a desktop-sized rendition.
 */
const PHOTO_SIZES = "(max-width: 767px) 140px, 240px";

/** The hero renders once per page, so a fixed id is unique. */
const GAUGE_MASK_ID = "hero-gauge-arc";

/** Cells in each readout meter. */
const METER_CELLS = 10;

const DEFAULT_INTRO =
  "Building scalable, high-performance web applications with a focus on clean architecture, security, and exceptional developer experience.";

/**
 * HUD hero panel: status, name, title, introduction and the two primary
 * actions, beside the profile photo in a ring gauge, with data readouts along
 * the bottom edge.
 *
 * Rendered on the server. Entrance motion is CSS and transform-only (the ring
 * turns, meters fill); the copy and photo paint at full opacity with the first
 * HTML, so Largest Contentful Paint never waits for hydration or a fade.
 */
export function HeroSection({ hero, photoSrc, resumeAvailable, readouts }: Props) {
  const name = hero?.name || siteConfig.name;

  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      <div className={styles.panel}>
        <span className={styles.bracket} aria-hidden="true" />

        <div className={styles.grid}>
          <div className={styles.gauge}>
            <svg className={styles.rings} viewBox="0 0 340 340" aria-hidden="true" focusable="false">
              <mask id={GAUGE_MASK_ID}>
                <circle
                  className={styles.arcMask}
                  cx="170"
                  cy="170"
                  r="160"
                  pathLength={100}
                  transform="rotate(-90 170 170)"
                />
              </mask>
              <circle className={styles.trackUnlit} cx="170" cy="170" r="160" />
              <circle className={styles.trackLit} cx="170" cy="170" r="160" mask={`url(#${GAUGE_MASK_ID})`} />
              <g className={styles.spinner}>
                <circle className={styles.inner} cx="170" cy="170" r="140" />
              </g>
              <path className={styles.ticks} d="M170 0v14M170 326v14M0 170h14M326 170h14" />
            </svg>
            <div className={styles.photo}>
              {photoSrc ? (
                <Image
                  src={photoSrc}
                  alt={hero?.photoAlt || `${name} — profile photo`}
                  fill
                  className={styles.photoImage}
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

          <div className={styles.copy}>
            <p className={styles.status}>
              <span className={styles.statusDot} aria-hidden="true" />
              Available for opportunities
            </p>
            <h1 id="hero-heading" className={styles.name}>
              {name}
            </h1>
            <p className={styles.title}>
              <svg className={styles.chevrons} viewBox="0 0 34 18" aria-hidden="true" focusable="false">
                <path d="M2 2l7 7-7 7M13 2l7 7-7 7M24 2l7 7-7 7" />
              </svg>
              {hero?.title || "Computer Engineer"}
            </p>
            <p className={styles.intro}>{hero?.introduction || DEFAULT_INTRO}</p>

            <div className={styles.actions}>
              <Button href="/projects" size="lg" iconRight="arrow-right">
                View projects
              </Button>
              {resumeAvailable && (
                // Plain <a> in a new tab: a Next <Link> would prefetch the PDF.
                <Button href={siteConfig.resumePath} external size="lg" variant="secondary" icon="download">
                  Resume PDF
                  <span className="sr-only">(opens in a new tab)</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {readouts.length > 0 && (
          <dl className={styles.readouts}>
            {readouts.map(({ label, value }) => {
              const lit = litCells(value, METER_CELLS);
              return (
                <div key={label} className={styles.readout}>
                  <dt className={styles.readoutLabel}>{label}</dt>
                  <dd className={styles.readoutValue}>{formatReadout(value)}</dd>
                  <dd className={styles.meter} aria-hidden="true">
                    {Array.from({ length: METER_CELLS }, (_, i) => (
                      <i key={i} data-on={i < lit ? "" : undefined} />
                    ))}
                  </dd>
                </div>
              );
            })}
          </dl>
        )}
      </div>
    </section>
  );
}
