import type { CSSProperties, ReactNode } from "react";
import styles from "./TechBackdrop.module.less";

/**
 * Decorative layer of faint tech glyphs (circuit traces, code fragments and
 * generic tech icons) that drifts behind the public pages.
 *
 * It is pure server-rendered SVG and text: no client JS, no images to fetch,
 * nothing in the accessibility tree and nothing that can take pointer events.
 * The layer is fixed to the viewport, so it never adds to page height (no
 * layout shift), and glyphs hug the side gutters so they stay out of the way
 * of the content column. Motion is transform-only and is skipped entirely
 * under prefers-reduced-motion.
 */

type GlyphKind =
  | "circuit"
  | "circuitAlt"
  | "chip"
  | "brackets"
  | "braces"
  | "terminal"
  | "branch"
  | "database"
  | "cloud"
  | "code";

interface Glyph {
  readonly kind: GlyphKind;
  /** Vertical position in the viewport (a percentage keeps it fluid). */
  readonly top: string;
  /** Which side gutter the glyph lives in. */
  readonly side: "left" | "right";
  /**
   * Distance from the viewport edge as a fraction of the side gutter (the
   * space outside the content column). Negative values tuck the glyph past
   * the edge. Icons are also capped at 55% of the gutter, so with an inset
   * of at most 0.3 a glyph always ends before the content starts.
   */
  readonly inset: number;
  /** Size in px: width for icons, font size for code. */
  readonly size: number;
  /** Drift cycle in seconds; staggered so glyphs never move in unison. */
  readonly duration: number;
  readonly delay: number;
  /** Slight rotation at the top of the drift, in degrees. */
  readonly tilt: number;
  /**
   * Size in px when the gutter is too narrow for the full set (phones,
   * tablets, small laptops). Only glyphs that set it show there: they shrink
   * and tuck mostly past the edge so they never sit under text.
   */
  readonly phoneSize?: number;
  /** Text for `code` glyphs. */
  readonly text?: string;
}

const GLYPHS: readonly Glyph[] = [
  { kind: "circuit", top: "14%", side: "left", inset: -0.15, size: 170, duration: 22, delay: 0, tilt: 0, phoneSize: 64 },
  { kind: "brackets", top: "34%", side: "left", inset: 0.3, size: 46, duration: 16, delay: -4, tilt: -6 },
  { kind: "code", top: "54%", side: "left", inset: 0.2, size: 13, duration: 20, delay: -9, tilt: 0, text: "200 OK" },
  { kind: "chip", top: "72%", side: "left", inset: 0.25, size: 56, duration: 18, delay: -2, tilt: 8, phoneSize: 40 },
  { kind: "branch", top: "90%", side: "left", inset: 0.15, size: 40, duration: 17, delay: -11, tilt: -4 },
  { kind: "terminal", top: "10%", side: "right", inset: 0.25, size: 50, duration: 19, delay: -6, tilt: 5 },
  { kind: "circuitAlt", top: "28%", side: "right", inset: -0.15, size: 160, duration: 24, delay: -13, tilt: 0 },
  { kind: "braces", top: "50%", side: "right", inset: 0.25, size: 44, duration: 15, delay: -3, tilt: 6, phoneSize: 36 },
  { kind: "database", top: "66%", side: "right", inset: 0.3, size: 42, duration: 21, delay: -8, tilt: -5 },
  { kind: "code", top: "82%", side: "right", inset: 0.1, size: 13, duration: 23, delay: -15, tilt: 0, text: "0x3BEA62" },
  { kind: "cloud", top: "94%", side: "right", inset: 0.3, size: 54, duration: 18, delay: -5, tilt: 4 },
];

/** Shared SVG attributes: line art in currentColor, no fill. */
const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Node({ cx, cy }: { cx: number; cy: number }) {
  return <circle cx={cx} cy={cy} r={3.5} fill="currentColor" />;
}

function renderIcon(kind: Exclude<GlyphKind, "code">): ReactNode {
  switch (kind) {
    case "circuit":
      return (
        <svg viewBox="0 0 170 120">
          <path {...STROKE} d="M0 20h60l20 20h50M0 60h40l20 20h70l20-20M0 100h90" />
          <Node cx={130} cy={40} />
          <Node cx={150} cy={60} />
          <Node cx={90} cy={100} />
        </svg>
      );
    case "circuitAlt":
      return (
        <svg viewBox="0 0 160 120">
          <path {...STROKE} d="M160 18h-50l-18 18H30M160 58h-70l-20 20H20M160 98h-40l-14-14" />
          <Node cx={30} cy={36} />
          <Node cx={20} cy={78} />
          <Node cx={106} cy={84} />
        </svg>
      );
    case "chip":
      return (
        <svg viewBox="0 0 48 48">
          <rect {...STROKE} x={12} y={12} width={24} height={24} />
          <rect {...STROKE} x={19} y={19} width={10} height={10} />
          <path {...STROKE} d="M18 12V5M24 12V5M30 12V5M18 43v-7M24 43v-7M30 43v-7M12 18H5M12 24H5M12 30H5M43 18h-7M43 24h-7M43 30h-7" />
        </svg>
      );
    case "brackets":
      return (
        <svg viewBox="0 0 48 32">
          <path {...STROKE} d="M14 6 4 16l10 10M34 6l10 10-10 10M28 4l-8 24" />
        </svg>
      );
    case "braces":
      return (
        <svg viewBox="0 0 48 40">
          <path {...STROKE} d="M16 4c-5 0-6 3-6 7v3c0 3-2 6-6 6 4 0 6 3 6 6v3c0 4 1 7 6 7M32 4c5 0 6 3 6 7v3c0 3 2 6 6 6-4 0-6 3-6 6v3c0 4-1 7-6 7" />
        </svg>
      );
    case "terminal":
      return (
        <svg viewBox="0 0 48 36">
          <rect {...STROKE} x={2} y={2} width={44} height={32} />
          <path {...STROKE} d="m10 12 6 6-6 6M22 25h12" />
        </svg>
      );
    case "branch":
      return (
        <svg viewBox="0 0 36 44">
          <path {...STROKE} d="M10 8v28M10 30c0-8 16-6 16-16" />
          <circle {...STROKE} cx={10} cy={6} r={4} />
          <circle {...STROKE} cx={10} cy={38} r={4} />
          <circle {...STROKE} cx={26} cy={10} r={4} />
        </svg>
      );
    case "database":
      return (
        <svg viewBox="0 0 40 44">
          <ellipse {...STROKE} cx={20} cy={8} rx={16} ry={6} />
          <path {...STROKE} d="M4 8v28c0 3 7 6 16 6s16-3 16-6V8M4 22c0 3 7 6 16 6s16-3 16-6" />
        </svg>
      );
    case "cloud":
      return (
        <svg viewBox="0 0 56 36">
          <path {...STROKE} d="M16 32h26a10 10 0 0 0 0-20 14 14 0 0 0-26-2A11 11 0 0 0 16 32Z" />
          <path {...STROKE} d="m24 22 4-4 4 4M28 18v9" />
        </svg>
      );
  }
}

/** Geometry goes in as custom properties so the stylesheet owns the responsive rules. */
function glyphStyle(glyph: Glyph): CSSProperties {
  const vars: Record<string, string> = {
    "--glyph-top": glyph.top,
    "--glyph-inset": String(glyph.inset),
    "--glyph-size": `${glyph.size}px`,
    "--drift-duration": `${glyph.duration}s`,
    "--drift-delay": `${glyph.delay}s`,
    "--drift-tilt": `${glyph.tilt}deg`,
  };
  if (glyph.phoneSize !== undefined) vars["--glyph-phone-size"] = `${glyph.phoneSize}px`;
  return vars as CSSProperties;
}

export function TechBackdrop() {
  return (
    <div className={styles.backdrop} aria-hidden="true" data-tech-backdrop="">
      {GLYPHS.map((glyph, i) => (
        <span
          key={i}
          className={glyph.kind === "code" ? `${styles.glyph} ${styles.code}` : styles.glyph}
          data-phone={glyph.phoneSize !== undefined ? "" : undefined}
          data-side={glyph.side}
          style={glyphStyle(glyph)}
        >
          {glyph.kind === "code" ? glyph.text : renderIcon(glyph.kind)}
        </span>
      ))}
    </div>
  );
}
