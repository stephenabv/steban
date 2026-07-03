import type { Metadata } from "next";
import { HeroSection } from "@/features/home/HeroSection";
import { FeaturedCarousel } from "@/features/home/FeaturedCarousel";
import { siteConfig } from "@/config/site";
import { personSchema, websiteSchema } from "@/lib/structuredData";

export const metadata: Metadata = {
  title: { absolute: siteConfig.title },
  alternates: { canonical: siteConfig.url },
};

// TODO: replace with real data from services when DB is wired up
const mockHero = null;
const mockFeatured: never[] = [];

export default function HomePage() {
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
      <FeaturedCarousel projects={mockFeatured} />
    </>
  );
}
