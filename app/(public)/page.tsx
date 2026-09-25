import type { Metadata } from "next";
import { HeroSection } from "@/features/home/HeroSection";
import { FeaturedCarousel } from "@/features/home/FeaturedCarousel";
import { CtaBand } from "@/features/shared/CtaBand";
import { siteConfig } from "@/config/site";
import { jsonLd, personSchema, websiteSchema } from "@/lib/structuredData";
import { getHeroContent, getPageMetadata, getPublicContact } from "@/lib/content/publicContent";
import { getProfilePhotoService, getProjectService, getResumeService, ProfilePhotoService } from "@/server/services";

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
    getResumeService().getActive(),
    getProfilePhotoService().getActive(),
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
      {/* Plain <script> (not next/script) so JSON-LD is in the initial server HTML
          where non-JS crawlers can read it. Data blocks are exempt from CSP script-src. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            personSchema({
              name: hero?.name,
              jobTitle: hero?.title,
              email: contact.email,
              sameAs: contact.profiles.map((p) => p.url),
            })
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(websiteSchema()) }}
      />
      <HeroSection hero={hero} photoSrc={photoSrc} resumeAvailable={resumeAvailable} nextSectionId={featured.length > 0 ? FEATURED_SECTION_ID : undefined} />
      <FeaturedCarousel id={FEATURED_SECTION_ID} projects={featured} />
      <CtaBand />
    </>
  );
}
