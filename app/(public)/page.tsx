import type { Metadata } from "next";
import { HeroSection } from "@/features/home/HeroSection";
import { FeaturedCarousel } from "@/features/home/FeaturedCarousel";
import { siteConfig } from "@/config/site";
import { personSchema, websiteSchema } from "@/lib/structuredData";
import { getProjectService } from "@/server/services";

export const metadata: Metadata = {
  title: { absolute: siteConfig.title },
  alternates: { canonical: siteConfig.url },
};

// TODO: replace hero with real data from HeroService when it's wired up
const mockHero = null;

export default async function HomePage() {
  const featuredResult = await getProjectService().getFeatured();
  const featured = featuredResult.ok ? featuredResult.value : [];

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
      <HeroSection hero={mockHero} />
      <FeaturedCarousel projects={featured} />
    </>
  );
}
