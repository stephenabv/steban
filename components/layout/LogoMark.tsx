import type { SVGProps } from "react";

/**
 * The brand mark: an "S" drawn as a circuit trace, a node on each end, set
 * between code brackets on the action-blue tile. One geometry for every
 * rendering (the in-page logo, the favicon, the Apple touch icon and the share
 * image), so they cannot drift apart. No hooks, gradients or text: it renders
 * the same in React and in `next/og` (Satori), and stays legible at 16px.
 */
export const LOGO_COLORS = {
  tile: "#0866ff",
  trace: "#ffffff",
  accent: "#a9c7ff",
} as const;

const VIEWBOX = 64;
const TILE_RADIUS = 14;
const BRACKETS = "M17 23l-8 9 8 9M47 23l8 9-8 9";
const TRACE = "M40 21H29a5.5 5.5 0 0 0 0 11h6a5.5 5.5 0 0 1 0 11H24";
const NODES = [
  { cx: 40, cy: 21 },
  { cx: 24, cy: 43 },
] as const;

type LogoMarkProps = Omit<SVGProps<SVGSVGElement>, "viewBox" | "children"> & {
  size: number;
  /** Drop the tile's rounded corners, e.g. where the platform masks the icon itself. */
  square?: boolean;
};

export function LogoMark({ size, square = false, ...svgProps }: LogoMarkProps) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} {...svgProps}>
      <rect width={VIEWBOX} height={VIEWBOX} rx={square ? 0 : TILE_RADIUS} fill={LOGO_COLORS.tile} />
      <path
        d={BRACKETS}
        fill="none"
        stroke={LOGO_COLORS.accent}
        strokeWidth={4.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={TRACE}
        fill="none"
        stroke={LOGO_COLORS.trace}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {NODES.map(({ cx, cy }) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={3.5} fill={LOGO_COLORS.accent} />
      ))}
    </svg>
  );
}
