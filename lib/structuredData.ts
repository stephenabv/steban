import { siteConfig, siteUrl } from "@/config/site";
import { socialLinks } from "@/config/social";

export function personSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.name,
    url: siteConfig.url,
    jobTitle: "Computer Engineer",
    email: `mailto:${siteConfig.author.email}`,
    image: siteUrl("/opengraph-image"),
    knowsAbout: [
      "Computer Engineering",
      "Full-Stack Web Development",
      "Cloud Architecture",
      "Scalable Systems",
    ],
    sameAs: [
      socialLinks.github.url,
      socialLinks.linkedin.url,
      socialLinks.facebook.url,
    ],
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    author: { "@type": "Person", name: siteConfig.name },
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
