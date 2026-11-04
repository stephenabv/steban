import type { Metadata } from "next";
import { HeroSection } from "@/features/home/HeroSection";
import { FeaturedProjects } from "@/features/home/FeaturedProjects";
import { CtaBand } from "@/features/shared/CtaBand";
import { siteConfig } from "@/config/site";
import { personSchema, websiteSchema } from "@/lib/structuredData";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildReadouts } from "@/lib/home/readouts";
import {
  getAboutContent,
  getHeroContent,
  getPageMetadata,
  getPublicContact,
  toPersonProfile,
} from "@/lib/content/publicContent";
import { getProfilePhotoService, getProjectService, getResumeService, ProfilePhotoService } from "@/server/services";
import { toProjectCardData } from "@/features/projects/toProjectCardData";

export function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("home", {
    title: { absolute: siteConfig.title },
    alternates: { canonical: siteConfig.url },
  });
}

export default async function HomePage() {
  const [featuredResult, totalResult, resumeResult, photoResult, hero, about, contact] = await Promise.all([
    getProjectService().getFeatured(),
    // Only the total is needed for the readout.
    getProjectService().getAll({ pageSize: 1 }),
    getResumeService().getPublished(),
    getProfilePhotoService().getPublished(),
    getHeroContent(),
    getAboutContent(),
    getPublicContact(),
  ]);
  const featured = featuredResult.ok ? featuredResult.value.map(toProjectCardData) : [];
  // Metadata only — the file itself is streamed by /resume.pdf on demand.
  const resumeAvailable = resumeResult.ok && resumeResult.value !== null;
  // A storage failure degrades to the initials placeholder rather than failing the page.
  const photoSrc = photoResult.ok && photoResult.value ? ProfilePhotoService.publicPath(photoResult.value) : null;
  const readouts = buildReadouts({
    projectCount: totalResult.ok ? totalResult.value.total : null,
    skillCount: about?.skills.length ?? 0,
    experience: about?.experience ?? [],
  });

  return (
    <>
      <JsonLd data={personSchema(toPersonProfile(hero, contact))} />
      <JsonLd data={websiteSchema()} />
      <HeroSection hero={hero} photoSrc={photoSrc} resumeAvailable={resumeAvailable} readouts={readouts} />
      <FeaturedProjects projects={featured} />
      <CtaBand />
    </>
  );
}
