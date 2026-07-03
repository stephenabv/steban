export const siteConfig = {
  name: "Stephen Abueva",
  title: "Stephen Abueva — Computer Engineer",
  description:
    "Computer Engineer specializing in full-stack web development, cloud architecture, and scalable systems.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://steban.vercel.app",
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
