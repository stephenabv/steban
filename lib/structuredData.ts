import { siteConfig, siteUrl } from "@/config/site";

/**
 * Serialises JSON-LD for an inline <script>. JSON.stringify leaves "<" as-is,
 * so content containing "</script>" could close the tag; < is decoded
 * identically by JSON parsers.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

const CONTEXT = "https://schema.org";

/**
 * Stable node identifiers, so the Person and WebSite described on one page are
 * recognisably the same entities referenced from every other page.
 */
export const SCHEMA_IDS = {
  person: siteUrl("/#person"),
  website: siteUrl("/#website"),
} as const;

export interface PersonProfile {
  name?: string;
  jobTitle?: string;
  email: string;
  sameAs: string[];
}

function personNode(person: PersonProfile) {
  return {
    "@type": "Person",
    "@id": SCHEMA_IDS.person,
    name: person.name || siteConfig.name,
    url: siteConfig.url,
    jobTitle: person.jobTitle || "Computer Engineer",
    description: siteConfig.description,
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

/** Reference to the site owner, for author/publisher fields. */
function personRef(name?: string) {
  return { "@type": "Person", "@id": SCHEMA_IDS.person, name: name || siteConfig.name };
}

export function personSchema(person: PersonProfile) {
  return { "@context": CONTEXT, ...personNode(person) };
}

export function websiteSchema() {
  return {
    "@context": CONTEXT,
    "@type": "WebSite",
    "@id": SCHEMA_IDS.website,
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: "en",
    author: personRef(),
    publisher: personRef(),
  };
}

/**
 * ProfilePage for the About page: Google's guidelines cover "About Me" pages
 * whose primary focus is one person affiliated with the site.
 * https://developers.google.com/search/docs/appearance/structured-data/profile-page
 */
export function profilePageSchema(input: { url: string; person: PersonProfile; dateModified?: Date }) {
  return {
    "@context": CONTEXT,
    "@type": "ProfilePage",
    url: input.url,
    isPartOf: { "@id": SCHEMA_IDS.website },
    ...(input.dateModified ? { dateModified: input.dateModified.toISOString() } : {}),
    mainEntity: personNode(input.person),
  };
}

export interface ProjectSchemaInput {
  url: string;
  title: string;
  summary: string;
  coverImage: string;
  technologies: string[];
  liveUrl?: string;
  githubUrl?: string;
  publishedAt: Date;
  updatedAt: Date;
}

export function projectSchema(project: ProjectSchemaInput) {
  const sameAs = [project.liveUrl, project.githubUrl].filter((url): url is string => Boolean(url));
  return {
    "@context": CONTEXT,
    "@type": "CreativeWork",
    "@id": `${project.url}#project`,
    name: project.title,
    url: project.url,
    ...(project.summary ? { description: project.summary } : {}),
    ...(project.coverImage ? { image: project.coverImage } : {}),
    ...(project.technologies.length > 0 ? { keywords: project.technologies.join(", ") } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    datePublished: project.publishedAt.toISOString(),
    dateModified: project.updatedAt.toISOString(),
    inLanguage: "en",
    author: personRef(),
    isPartOf: { "@id": SCHEMA_IDS.website },
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
