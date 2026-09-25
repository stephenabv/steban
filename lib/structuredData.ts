import { siteConfig, siteUrl } from "@/config/site";

/**
 * Serialises JSON-LD for an inline <script>. JSON.stringify leaves "<" as-is,
 * so content containing "</script>" could close the tag; \u003c is decoded
 * identically by JSON parsers.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function personSchema(person: { name?: string; jobTitle?: string; email: string; sameAs: string[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name || siteConfig.name,
    url: siteConfig.url,
    jobTitle: person.jobTitle || "Computer Engineer",
    ...(person.email ? { email: `mailto:${person.email}` } : {}),
    image: siteUrl("/opengraph-image"),
    knowsAbout: [
      "Computer Engineering",
      "Full-Stack Web Development",
      "Cloud Architecture",
      "Scalable Systems",
    ],
    sameAs: person.sameAs,
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
