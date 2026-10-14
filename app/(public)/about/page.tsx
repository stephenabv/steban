import type { Metadata } from "next";
import { AboutContent } from "@/features/about/AboutContent";
import { PageShell } from "@/features/shared/PageShell";
import { CtaBand } from "@/features/shared/CtaBand";
import { siteConfig, siteUrl } from "@/config/site";
import {
  getAboutContent,
  getHeroContent,
  getPageMetadata,
  getPublicContact,
  toPersonProfile,
} from "@/lib/content/publicContent";
import { breadcrumbSchema, profilePageSchema } from "@/lib/structuredData";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageSeoDefaults } from "@/config/seo";

export function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("about", {
    title: pageSeoDefaults.about.title,
    description: pageSeoDefaults.about.description,
    alternates: { canonical: siteUrl("/about") },
  });
}

export default async function AboutPage() {
  const [about, hero, contact] = await Promise.all([getAboutContent(), getHeroContent(), getPublicContact()]);
  const url = siteUrl("/about");
  return (
    <>
      <JsonLd
        data={profilePageSchema({ url, person: toPersonProfile(hero, contact), dateModified: about?.updatedAt })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: siteConfig.name, url: siteUrl() },
          { name: pageSeoDefaults.about.title, url },
        ])}
      />
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
