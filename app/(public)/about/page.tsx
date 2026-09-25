import type { Metadata } from "next";
import { AboutContent } from "@/features/about/AboutContent";
import { PageShell } from "@/features/shared/PageShell";
import { CtaBand } from "@/features/shared/CtaBand";
import { siteConfig, siteUrl } from "@/config/site";

export const metadata: Metadata = {
  title: "About",
  description: `Learn more about ${siteConfig.name} — skills, experience, education, and background.`,
  alternates: { canonical: siteUrl("/about") },
};

// TODO: fetch from AboutService when DB is wired up
const about = null;

export default function AboutPage() {
  return (
    <>
      <PageShell
        eyebrow="About"
        title="About me"
        description="Computer Engineer with a passion for building scalable, secure, and beautiful digital experiences."
      >
        <AboutContent about={about} />
      </PageShell>
      <CtaBand />
    </>
  );
}
