import type { Metadata } from "next";
import { HeroSection } from "@/features/home/HeroSection";
import { FeaturedFeed } from "@/features/home/FeaturedFeed";
import { siteConfig } from "@/config/site";
import { personSchema, websiteSchema } from "@/lib/structuredData";
import { JsonLd } from "@/components/seo/JsonLd";
import { getHeroContent, getPageMetadata, getPublicContact, toPersonProfile } from "@/lib/content/publicContent";
import { getProfilePhotoService, getProjectService, getResumeService, ProfilePhotoService } from "@/server/services";
import styles from "@/features/home/HomePage.module.less";

export function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("home", {
    title: { absolute: siteConfig.title },
    alternates: { canonical: siteConfig.url },
  });
}

const FEATURED_SECTION_ID = "featured";

export default async function HomePage() {
  const [featuredResult, resumeResult, photoResult, hero, contact] = await Promise.all([
    getProjectService().getFeatured(),
    getResumeService().getPublished(),
    getProfilePhotoService().getPublished(),
    getHeroContent(),
    getPublicContact(),
  ]);
  const featured = featuredResult.ok ? featuredResult.value : [];
  // Metadata only — the file itself is streamed by /resume.pdf on demand.
  const resumeAvailable = resumeResult.ok && resumeResult.value !== null;
  // A storage failure degrades to the initials placeholder rather than failing the page.
  const photoSrc = photoResult.ok && photoResult.value ? ProfilePhotoService.publicPath(photoResult.value) : null;

  return (
    <>
      <JsonLd data={personSchema(toPersonProfile(hero, contact))} />
      <JsonLd data={websiteSchema()} />
      <HeroSection hero={hero} photoSrc={photoSrc} resumeAvailable={resumeAvailable} />
      {/* One entry point per destination: the hero carries the contact and
          resume actions, the feed links to all projects, and the navbar and
          footer cover the rest, so nothing here repeats them. */}
      <div className={styles.layout}>
        <FeaturedFeed id={FEATURED_SECTION_ID} projects={featured} />
      </div>
    </>
  );
}
