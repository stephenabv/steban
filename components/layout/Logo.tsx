import { useId } from "react";

/**
 * Minimalist brand mark for Stephen Abueva — Computer Engineer.
 * An indigo rounded square with an "SA" monogram and a circuit-node accent
 * (the small dot terminating the trace under the letters).
 * Also reproduced in app/icon.tsx / app/apple-icon.tsx / app/opengraph-image.tsx —
 * keep the geometry and colors in sync when changing it.
 */
export function Logo({ size = 32 }: { size?: number }) {
  const gradientId = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Stephen Abueva logo"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill={`url(#${gradientId})`} />
      <text
        x="32"
        y="30"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ffffff"
        fontFamily="var(--font-sans), Inter, ui-sans-serif, system-ui, sans-serif"
        fontSize="26"
        fontWeight="700"
        letterSpacing="0.5"
      >
        SA
      </text>
      {/* circuit trace + node — a nod to computer engineering */}
      <path
        d="M18 48h20"
        stroke="#c7d2fe"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="44" cy="48" r="3.5" fill="#c7d2fe" />
    </svg>
  );
}
