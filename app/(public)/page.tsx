import type { Metadata } from "next";
import Script from "next/script";
import { HeroSection } from "@/features/home/HeroSection";
import { FeaturedCarousel } from "@/features/home/FeaturedCarousel";
import { siteConfig } from "@/config/site";
import { personSchema, websiteSchema } from "@/lib/structuredData";

export const metadata: Metadata = {
  title: siteConfig.title,
  alternates: { canonical: siteConfig.url },
};

// TODO: replace with real data from services when DB is wired up
const mockHero = null;
const mockFeatured: never[] = [];

export default function HomePage() {
  return (
    <>
      <Script
        id="schema-person"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema()) }}
      />
      <Script
        id="schema-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema()) }}
      />
      <HeroSection hero={mockHero} />
      <FeaturedCarousel projects={mockFeatured} />
    </>
  );
}
