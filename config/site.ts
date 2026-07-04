// Single source of truth for the site origin. Normalized to strip any trailing
// slash so path concatenation (`${SITE_URL}${path}`) never produces "//".
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://steban.vercel.app").replace(
  /\/+$/,
  ""
);

// Joins a path onto SITE_URL, guaranteeing exactly one slash between them.
// siteUrl() -> SITE_URL, siteUrl("/projects") -> `${SITE_URL}/projects`.
export function siteUrl(path = ""): string {
  if (!path) return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export const siteConfig = {
  name: "Stephen Abueva",
  title: "Stephen Abueva — Computer Engineer",
  description:
    "Computer Engineer specializing in full-stack web development, cloud architecture, and scalable systems.",
  url: SITE_URL,
  locale: "en_US",
  keywords: [
    "Stephen Abueva",
    "Computer Engineer",
    "Software Engineer",
    "Full-Stack Developer",
    "Web Development",
    "Cloud Architecture",
    "Portfolio",
  ],
  author: {
    name: "Stephen Abueva",
    email: "stephen.abueva@gmail.com",
  },
  resumeUrl: "/resume.pdf",
} as const;

export type SiteConfig = typeof siteConfig;
