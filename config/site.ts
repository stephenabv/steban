export const siteConfig = {
  name: "Stephen Abueva",
  title: "Stephen Abueva — Senior Software Engineer",
  description:
    "Senior Software Engineer specializing in full-stack web development, cloud architecture, and scalable systems.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://steban.vercel.app",
  locale: "en_US",
  author: {
    name: "Stephen Abueva",
    email: "stephen.abueva@gmail.com",
  },
  resumeUrl: "/resume.pdf",
} as const;

export type SiteConfig = typeof siteConfig;
