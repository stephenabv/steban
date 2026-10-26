/**
 * The site's decorative gradient (cover wallpaper, story rings, card and band
 * rules). Admin-chosen colour stops are turned into the CSS custom properties
 * that every gradient surface reads, so one setting restyles them all.
 *
 * Isomorphic: the root layout renders these server-side on <html> (first paint
 * is already correct, no flash), and the admin editor uses them for its preview.
 */

/** The Instagram hues the site ships with, in ring order (yellow → blue). */
export const DEFAULT_GRADIENT_STOPS: readonly string[] = [
  "#feda75",
  "#fa7e1e",
  "#d62976",
  "#962fbf",
  "#4f5bd5",
];

export const GRADIENT_STOP_LIMITS = { min: 2, max: 6 } as const;

/** Six-digit hex only: the value is written into CSS, so nothing else is accepted. */
const HEX_COLOR = /^#[0-9a-f]{6}$/;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR.test(value);
}

/** Lower-cases and expands `#abc` to `#aabbcc`; returns null for anything else. */
export function normalizeHexColor(value: string): string | null {
  const v = value.trim().toLowerCase();
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(v);
  const full = short ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}` : v;
  return isHexColor(full) ? full : null;
}

export function isValidGradientStops(stops: unknown): stops is string[] {
  return (
    Array.isArray(stops) &&
    stops.length >= GRADIENT_STOP_LIMITS.min &&
    stops.length <= GRADIENT_STOP_LIMITS.max &&
    stops.every(isHexColor)
  );
}

export function isDefaultGradient(stops: readonly string[]): boolean {
  return (
    stops.length === DEFAULT_GRADIENT_STOPS.length &&
    stops.every((c, i) => c === DEFAULT_GRADIENT_STOPS[i])
  );
}

/** The custom properties every gradient surface reads (styles/variables.less). */
export const GRADIENT_PROPERTIES = {
  /** Story rings, avatar ring, eyebrow marks, page loader. */
  ring: "--gradient-ig",
  /** Hero cover wallpaper. */
  cover: "--gradient-cover",
  /** Horizontal rules: project card tops, CTA band. */
  rule: "--gradient-rule",
} as const;

export type GradientProperty = (typeof GRADIENT_PROPERTIES)[keyof typeof GRADIENT_PROPERTIES];

function evenStops(stops: readonly string[]): string {
  const last = stops.length - 1;
  return stops.map((color, i) => `${color} ${Math.round((i / last) * 1000) / 10}%`).join(", ");
}

/**
 * CSS for each gradient surface. The cover runs the stops in reverse, as the
 * default does (blue on the left, warm hues to the right).
 */
export function buildGradientProperties(
  stops: readonly string[]
): Record<GradientProperty, string> {
  return {
    [GRADIENT_PROPERTIES.ring]: `linear-gradient(45deg, ${evenStops(stops)})`,
    [GRADIENT_PROPERTIES.cover]: `linear-gradient(120deg, ${evenStops([...stops].reverse())})`,
    [GRADIENT_PROPERTIES.rule]: `linear-gradient(90deg, ${evenStops(stops)})`,
  };
}

/**
 * The shipped look, hand-tuned: the cover leads with Facebook blue (#0866ff,
 * @color-accent) and spaces the hues unevenly. Kept verbatim for the default.
 */
const DEFAULT_GRADIENT_PROPERTIES: Readonly<Record<GradientProperty, string>> = {
  [GRADIENT_PROPERTIES.ring]:
    "linear-gradient(45deg, #feda75 0%, #fa7e1e 25%, #d62976 50%, #962fbf 75%, #4f5bd5 100%)",
  [GRADIENT_PROPERTIES.cover]:
    "linear-gradient(120deg, #0866ff 0%, #4f5bd5 30%, #962fbf 55%, #d62976 78%, #fa7e1e 100%)",
  [GRADIENT_PROPERTIES.rule]:
    "linear-gradient(90deg, #feda75 0%, #fa7e1e 25%, #d62976 50%, #962fbf 75%, #4f5bd5 100%)",
};

/**
 * Inline style for <html> and for the admin preview. Missing or invalid stops
 * (e.g. a corrupted record) fall back to the default palette.
 */
export function gradientStyle(
  stops: readonly string[] | null | undefined
): Record<GradientProperty, string> {
  if (!stops || !isValidGradientStops(stops) || isDefaultGradient(stops))
    return { ...DEFAULT_GRADIENT_PROPERTIES };
  return buildGradientProperties(stops);
}
