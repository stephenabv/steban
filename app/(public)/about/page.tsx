import type { Metadata } from "next";
import { AboutContent } from "@/features/about/AboutContent";
import { PageShell } from "@/features/shared/PageShell";
import { CtaBand } from "@/features/shared/CtaBand";
import { siteUrl } from "@/config/site";
import { getAboutContent, getPageMetadata } from "@/lib/content/publicContent";
import { pageSeoDefaults } from "@/config/seo";

export function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("about", {
    title: pageSeoDefaults.about.title,
    description: pageSeoDefaults.about.description,
    alternates: { canonical: siteUrl("/about") },
  });
}

export default async function AboutPage() {
  const about = await getAboutContent();
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
