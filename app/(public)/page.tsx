import type { Metadata } from "next";
import { HeroSection } from "@/features/home/HeroSection";
import { FeaturedCarousel } from "@/features/home/FeaturedCarousel";
import { CtaBand } from "@/features/shared/CtaBand";
import { siteConfig } from "@/config/site";
import { personSchema, websiteSchema } from "@/lib/structuredData";
import { getProjectService, getResumeService } from "@/server/services";

export const metadata: Metadata = {
  title: { absolute: siteConfig.title },
  alternates: { canonical: siteConfig.url },
};

// TODO: replace hero with real data from HeroService when it's wired up
const mockHero = null;

const FEATURED_SECTION_ID = "featured";

export default async function HomePage() {
  const [featuredResult, resumeResult] = await Promise.all([
    getProjectService().getFeatured(),
    getResumeService().getActive(),
  ]);
  const featured = featuredResult.ok ? featuredResult.value : [];
  // Metadata only — the file itself is streamed by /resume.pdf on demand.
  const resumeAvailable = resumeResult.ok && resumeResult.value !== null;

  return (
    <>
      {/* Plain <script> (not next/script) so JSON-LD is in the initial server HTML
          where non-JS crawlers can read it. Data blocks are exempt from CSP script-src. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema()) }}
      />
      <HeroSection hero={mockHero} resumeAvailable={resumeAvailable} nextSectionId={featured.length > 0 ? FEATURED_SECTION_ID : undefined} />
      <FeaturedCarousel id={FEATURED_SECTION_ID} projects={featured} />
      <CtaBand />
    </>
  );
}
