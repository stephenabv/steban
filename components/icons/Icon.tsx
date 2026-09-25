import type { SVGProps } from "react";

/**
 * Central icon registry. Outline icons follow the 24px/2px-stroke grid
 * (Lucide geometry); brand marks are filled. Add new glyphs here instead of
 * inlining SVG in components so the set stays visually consistent.
 */
interface IconDefinition {
  readonly variant: "stroke" | "fill";
  readonly body: React.ReactNode;
}

const ICONS = {
  "arrow-right": { variant: "stroke", body: <path d="M5 12h14M12 5l7 7-7 7" /> },
  "arrow-left": { variant: "stroke", body: <path d="M19 12H5M12 19l-7-7 7-7" /> },
  "arrow-up": { variant: "stroke", body: <path d="M12 19V5M5 12l7-7 7 7" /> },
  "arrow-down": { variant: "stroke", body: <path d="M12 5v14M19 12l-7 7-7-7" /> },
  "arrow-up-right": { variant: "stroke", body: <path d="M7 17 17 7M7 7h10v10" /> },
  "chevron-left": { variant: "stroke", body: <path d="m15 18-6-6 6-6" /> },
  "chevron-right": { variant: "stroke", body: <path d="m9 18 6-6-6-6" /> },
  "chevron-down": { variant: "stroke", body: <path d="m6 9 6 6 6-6" /> },
  "chevrons-left": { variant: "stroke", body: <path d="m11 17-5-5 5-5M18 17l-5-5 5-5" /> },
  "chevrons-right": { variant: "stroke", body: <path d="m6 17 5-5-5-5M13 17l5-5-5-5" /> },
  sort: { variant: "stroke", body: <path d="m7 15 5 5 5-5M7 9l5-5 5 5" /> },
  menu: { variant: "stroke", body: <path d="M4 6h16M4 12h16M4 18h16" /> },
  close: { variant: "stroke", body: <path d="M18 6 6 18M6 6l12 12" /> },
  check: { variant: "stroke", body: <path d="M20 6 9 17l-5-5" /> },
  plus: { variant: "stroke", body: <path d="M12 5v14M5 12h14" /> },
  search: {
    variant: "stroke",
    body: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
  },
  eye: {
    variant: "stroke",
    body: (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  },
  "eye-off": {
    variant: "stroke",
    body: (
      <>
        <path d="M10.7 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.2 3.1M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7c1.8 0 3.4-.5 4.8-1.3" />
        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M2 2l20 20" />
      </>
    ),
  },
  pencil: {
    variant: "stroke",
    body: <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />,
  },
  trash: {
    variant: "stroke",
    body: (
      <>
        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
      </>
    ),
  },
  external: {
    variant: "stroke",
    body: <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />,
  },
  download: {
    variant: "stroke",
    body: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />,
  },
  upload: {
    variant: "stroke",
    body: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />,
  },
  copy: {
    variant: "stroke",
    body: (
      <>
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </>
    ),
  },
  logout: {
    variant: "stroke",
    body: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  },
  sparkle: {
    variant: "stroke",
    body: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />,
  },
  info: {
    variant: "stroke",
    body: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </>
    ),
  },
  alert: {
    variant: "stroke",
    body: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </>
    ),
  },
  warning: {
    variant: "stroke",
    body: <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0ZM12 9v4M12 17h.01" />,
  },
  "check-circle": {
    variant: "stroke",
    body: (
      <>
        <path d="M22 11.1V12a10 10 0 1 1-5.9-9.1" />
        <path d="m22 4-10 10-3-3" />
      </>
    ),
  },
  refresh: {
    variant: "stroke",
    body: <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M3 21v-5h5" />,
  },
  image: {
    variant: "stroke",
    body: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </>
    ),
  },
  inbox: {
    variant: "stroke",
    body: (
      <>
        <path d="M22 12h-6l-2 3h-4l-2-3H2" />
        <path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1Z" />
      </>
    ),
  },
  mail: {
    variant: "stroke",
    body: (
      <>
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </>
    ),
  },
  "mail-open": {
    variant: "stroke",
    body: (
      <>
        <path d="M21.2 8.4c.5.4.8.9.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10c0-.7.3-1.2.8-1.6l8-5.6a2 2 0 0 1 2.4 0Z" />
        <path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10" />
      </>
    ),
  },
  grid: {
    variant: "stroke",
    body: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
  },
  user: {
    variant: "stroke",
    body: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
  },
  "file-text": {
    variant: "stroke",
    body: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </>
    ),
  },
  layers: {
    variant: "stroke",
    body: <path d="m12 2 10 5-10 5L2 7l10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" />,
  },
  star: {
    variant: "stroke",
    body: <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1Z" />,
  },
  "bar-chart": { variant: "stroke", body: <path d="M18 20V10M12 20V4M6 20v-6" /> },
  share: {
    variant: "stroke",
    body: (
      <>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
      </>
    ),
  },
  layout: {
    variant: "stroke",
    body: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </>
    ),
  },
  message: {
    variant: "stroke",
    body: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />,
  },
  globe: {
    variant: "stroke",
    body: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
      </>
    ),
  },
  code: { variant: "stroke", body: <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" /> },
  calendar: {
    variant: "stroke",
    body: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    ),
  },
  award: {
    variant: "stroke",
    body: (
      <>
        <circle cx="12" cy="8" r="6" />
        <path d="M15.5 13 17 22l-5-3-5 3 1.5-9" />
      </>
    ),
  },
  briefcase: {
    variant: "stroke",
    body: (
      <>
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </>
    ),
  },
  "graduation-cap": {
    variant: "stroke",
    body: <path d="M22 10 12 5 2 10l10 5 10-5ZM6 12v5c3 3 9 3 12 0v-5" />,
  },
  github: {
    variant: "fill",
    body: (
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    ),
  },
  linkedin: {
    variant: "fill",
    body: (
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    ),
  },
  facebook: {
    variant: "fill",
    body: (
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    ),
  },
} satisfies Record<string, IconDefinition>;

export type IconName = keyof typeof ICONS;

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
  /** Accessible label. When omitted the icon is decorative and hidden from assistive tech. */
  label?: string;
}

export function Icon({ name, size = 18, label, strokeWidth = 2, ...rest }: IconProps) {
  const icon: IconDefinition = ICONS[name];
  const isStroke = icon.variant === "stroke";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={isStroke ? "none" : "currentColor"}
      stroke={isStroke ? "currentColor" : undefined}
      strokeWidth={isStroke ? strokeWidth : undefined}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...rest}
    >
      {icon.body}
    </svg>
  );
}
