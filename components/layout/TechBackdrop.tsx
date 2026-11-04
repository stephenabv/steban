import type { CSSProperties, ReactNode } from "react";
import styles from "./TechBackdrop.module.less";
import { TechBackdropSensor } from "./TechBackdropSensor";

/**
 * Decorative layer of tech glyphs (circuit traces, code fragments and generic
 * tech icons) that roams across the public pages, over the content.
 *
 * The glyphs are server-rendered SVG and text: no images to fetch, nothing in
 * the accessibility tree, and the layer takes no pointer events, so every
 * link, button and text selection underneath keeps working. It is fixed to
 * the viewport, so it never adds to page height (no layout shift). Motion is
 * transform-only and is skipped under prefers-reduced-motion. A small client
 * sensor marks each glyph that is over content so it can fade there and
 * keep that content readable.
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

/** A route waypoint, as an offset from the start in viewport units (vw, vh). */
type Waypoint = readonly [x: number, y: number];

interface Glyph {
  readonly kind: GlyphKind;
  /** Start position in the viewport, in vw and vh. */
  readonly x: number;
  readonly y: number;
  /** Size in px: width for icons, font size for code. */
  readonly size: number;
  /** Two waypoints the glyph passes through before looping back to its start. */
  readonly route: readonly [Waypoint, Waypoint];
  /** Degrees turned per loop: 360 spins it, 0 only rocks it gently. */
  readonly spin: number;
  /** Loop length in seconds; delays are negative so glyphs start mid-route. */
  readonly duration: number;
  readonly delay: number;
  /** Shown on phones too. Kept to a handful so small screens stay calm. */
  readonly phone?: boolean;
  /** Text for `code` glyphs. */
  readonly text?: string;
}

const GLYPHS: readonly Glyph[] = [
  { kind: "circuit", x: 4, y: 12, size: 130, route: [[30, 18], [12, 50]], spin: 0, duration: 70, delay: 0, phone: true },
  { kind: "brackets", x: 22, y: 64, size: 46, route: [[28, -30], [50, 10]], spin: 360, duration: 48, delay: -12, phone: true },
  { kind: "code", x: 58, y: 8, size: 13, route: [[-30, 40], [-10, 70]], spin: 0, duration: 62, delay: -20, text: "200 OK" },
  { kind: "chip", x: 80, y: 70, size: 54, route: [[-40, -20], [-20, -55]], spin: -360, duration: 56, delay: -8, phone: true },
  { kind: "branch", x: 40, y: 86, size: 40, route: [[25, -45], [-25, -60]], spin: 0, duration: 66, delay: -30 },
  { kind: "terminal", x: 86, y: 14, size: 50, route: [[-45, 30], [-70, 5]], spin: 0, duration: 58, delay: -4, phone: true },
  { kind: "circuitAlt", x: 66, y: 44, size: 120, route: [[-50, 25], [-30, -30]], spin: 0, duration: 76, delay: -40 },
  { kind: "braces", x: 10, y: 40, size: 44, route: [[55, 30], [70, -25]], spin: 360, duration: 44, delay: -16, phone: true },
  { kind: "database", x: 50, y: 30, size: 42, route: [[30, 40], [-35, 45]], spin: 0, duration: 60, delay: -26 },
  { kind: "code", x: 30, y: 26, size: 13, route: [[40, 50], [-20, 60]], spin: 0, duration: 68, delay: -34, text: "0x3BEA62" },
  { kind: "cloud", x: 70, y: 88, size: 54, route: [[-55, -40], [10, -70]], spin: 0, duration: 64, delay: -10, phone: true },
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

/** Geometry and route go in as custom properties; the stylesheet owns motion. */
function glyphStyle(glyph: Glyph): CSSProperties {
  const [[x1, y1], [x2, y2]] = glyph.route;
  const vars: Record<string, string> = {
    "--glyph-x": `${glyph.x}vw`,
    "--glyph-y": `${glyph.y}vh`,
    "--glyph-size": `${glyph.size}px`,
    "--route-x1": `${x1}vw`,
    "--route-y1": `${y1}vh`,
    "--route-x2": `${x2}vw`,
    "--route-y2": `${y2}vh`,
    "--route-spin": `${glyph.spin}deg`,
    "--route-duration": `${glyph.duration}s`,
    "--route-delay": `${glyph.delay}s`,
  };
  return vars as CSSProperties;
}

export function TechBackdrop() {
  return (
    <div className={styles.backdrop} aria-hidden="true" data-tech-backdrop="">
      {GLYPHS.map((glyph, i) => (
        <span
          key={i}
          className={glyph.kind === "code" ? `${styles.glyph} ${styles.code}` : styles.glyph}
          data-phone={glyph.phone ? "" : undefined}
          data-glyph=""
          style={glyphStyle(glyph)}
        >
          {glyph.kind === "code" ? glyph.text : renderIcon(glyph.kind)}
        </span>
      ))}
      <TechBackdropSensor />
    </div>
  );
}
