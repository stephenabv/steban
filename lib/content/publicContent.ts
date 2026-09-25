import "server-only";
import type { Metadata } from "next";
import type { About, Hero, SeoPageKey } from "@/server/domain/entities";
import {
  getAboutService,
  getContactService,
  getFooterService,
  getHeroService,
  getSeoService,
} from "@/server/services";
import { siteConfig } from "@/config/site";
import { socialLinks } from "@/config/social";
import { legalNav } from "@/config/navigation";
import type { NavLink } from "@/config/navigation";
import type { SocialItem } from "@/components/layout/SocialLinks";

/*
 * Read models for the public site. Admin-saved content wins; config values are
 * the fallback when nothing has been saved yet or storage is unavailable, so a
 * database outage degrades to defaults instead of breaking public pages.
 */

async function orFallback<T>(label: string, read: () => Promise<{ ok: true; value: T } | { ok: false; error: Error }>, fallback: T): Promise<T> {
  try {
    const result = await read();
    if (result.ok) return result.value;
    console.error(`[content] ${label} unavailable:`, result.error.message);
  } catch (e) {
    console.error(`[content] ${label} unavailable:`, e);
  }
  return fallback;
}

export function getHeroContent(): Promise<Hero | null> {
  return orFallback("hero", () => getHeroService().getHero(), null);
}

export function getAboutContent(): Promise<About | null> {
  return orFallback("about", () => getAboutService().getAbout(), null);
}

export interface PublicContact {
  email: string;
  /** Only profiles with a URL; an emptied field in the admin hides that link. */
  profiles: SocialItem[];
}

export async function getPublicContact(): Promise<PublicContact> {
  const saved = await orFallback("contact info", () => getContactService().getContactInfo(), null);
  const email = saved ? saved.email : siteConfig.author.email;
  const urls = saved
    ? { github: saved.githubUrl, linkedin: saved.linkedinUrl, facebook: saved.facebookUrl }
    : { github: socialLinks.github.url, linkedin: socialLinks.linkedin.url, facebook: socialLinks.facebook.url };

  const profiles = (["github", "linkedin", "facebook"] as const)
    .filter((platform) => urls[platform])
    .map((platform) => ({
      platform,
      label: socialLinks[platform].label,
      url: urls[platform],
      icon: platform,
      external: true,
    }));
  return { email, profiles };
}

export async function getLegalLinks(): Promise<NavLink[]> {
  const footer = await orFallback("footer", () => getFooterService().get(), null);
  if (!footer) return [...legalNav];
  return [
    { href: footer.privacyUrl, label: "Privacy Policy" },
    { href: footer.termsUrl, label: "Terms & Conditions" },
  ];
}

/**
 * Page metadata with admin SEO overrides applied over the page's defaults.
 * Empty fields keep the default, so a partially filled form is safe.
 */
export async function getPageMetadata(pageKey: SeoPageKey, defaults: Metadata): Promise<Metadata> {
  const seo = await orFallback("seo", () => getSeoService().getByPageKey(pageKey), null);
  if (!seo) return defaults;

  const metadata: Metadata = { ...defaults };
  if (seo.title) metadata.title = pageKey === "home" ? { absolute: seo.title } : seo.title;
  if (seo.description) metadata.description = seo.description;
  if (seo.keywords.length > 0) metadata.keywords = seo.keywords;
  if (seo.title || seo.description || seo.ogImageUrl) {
    metadata.openGraph = {
      ...(defaults.openGraph ?? {}),
      ...(seo.title ? { title: seo.title } : {}),
      ...(seo.description ? { description: seo.description } : {}),
      ...(seo.ogImageUrl ? { images: [{ url: seo.ogImageUrl }] } : {}),
    };
  }
  if (seo.noIndex) metadata.robots = { index: false, follow: true };
  return metadata;
}
