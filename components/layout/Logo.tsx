import { LogoMark } from "./LogoMark";

/**
 * Brand mark for Stephen Abueva — Computer Engineer: a circuit-trace "S" with
 * a node on each end, between code brackets. The favicon, Apple touch icon and
 * share images draw the same `LogoMark`.
 */
export function Logo({ size = 32, decorative = false }: { size?: number; decorative?: boolean }) {
  return (
    <LogoMark
      size={size}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "Stephen Abueva logo"}
      aria-hidden={decorative || undefined}
      focusable="false"
    />
  );
}
