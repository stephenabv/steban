import { describe, expect, it, vi } from "vitest";
import { siteUrl } from "@/config/site";
import { searchVerification } from "@/lib/seo/searchVerification";
import { getRobotsTagHeader, isPlatformHost } from "@/server/security/robotsTag";
import {
  SCHEMA_IDS,
  breadcrumbSchema,
  jsonLd,
  profilePageSchema,
  projectSchema,
  websiteSchema,
} from "@/lib/structuredData";

describe("searchVerification", () => {
  it("renders nothing when no token is configured", () => {
    expect(searchVerification({})).toBeUndefined();
  });

  it("maps Google, Bing and Yandex tokens to their meta tags", () => {
    expect(
      searchVerification({
        GOOGLE_SITE_VERIFICATION: " g-Token_1 ",
        BING_SITE_VERIFICATION: "ABCDEF0123",
        YANDEX_VERIFICATION: "y123",
      })
    ).toEqual({ google: "g-Token_1", yandex: "y123", other: { "msvalidate.01": "ABCDEF0123" } });
  });

  it("ignores a pasted <meta> tag instead of rendering it", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(
      searchVerification({
        GOOGLE_SITE_VERIFICATION: '<meta name="google-site-verification" content="x" />',
      })
    ).toBeUndefined();
    expect(warn).toHaveBeenCalledOnce();
  });
});

describe("getRobotsTagHeader", () => {
  const bases = ["/admin", "/api"];

  it("noindexes admin and API paths only", () => {
    expect(getRobotsTagHeader("/admin/login", bases, "stephenabueva.dev")?.value).toBe(
      "noindex, nofollow"
    );
    expect(getRobotsTagHeader("/api", bases, "stephenabueva.dev")).not.toBeNull();
    expect(getRobotsTagHeader("/administrator", bases, "stephenabueva.dev")).toBeNull();
    expect(getRobotsTagHeader("/projects", bases, "stephenabueva.dev")).toBeNull();
  });

  it("noindexes every path on the vercel.app alias", () => {
    expect(isPlatformHost("steban.vercel.app")).toBe(true);
    expect(isPlatformHost("STEBAN-git-x.Vercel.App")).toBe(true);
    expect(isPlatformHost("notvercel.app")).toBe(false);
    expect(isPlatformHost("stephenabueva.dev")).toBe(false);
    expect(getRobotsTagHeader("/projects", bases, "steban.vercel.app")?.value).toBe(
      "noindex, nofollow"
    );
  });
});

describe("structured data", () => {
  const person = {
    name: "Stephen Abueva",
    jobTitle: "Engineer",
    email: "me@example.com",
    sameAs: ["https://github.com/x"],
  };

  it("escapes < so content can't close the script tag", () => {
    expect(jsonLd({ name: "</script><script>" })).not.toContain("<");
  });

  it("links the website to its owner by @id", () => {
    expect(websiteSchema()).toMatchObject({
      "@id": SCHEMA_IDS.website,
      publisher: { "@id": SCHEMA_IDS.person },
    });
  });

  it("describes the about page as a ProfilePage whose main entity is the owner", () => {
    const schema = profilePageSchema({
      url: siteUrl("/about"),
      person,
      dateModified: new Date("2026-09-01T00:00:00Z"),
    });
    expect(schema).toMatchObject({
      "@type": "ProfilePage",
      dateModified: "2026-09-01T00:00:00.000Z",
      mainEntity: {
        "@type": "Person",
        "@id": SCHEMA_IDS.person,
        name: "Stephen Abueva",
        sameAs: person.sameAs,
      },
    });
    expect(schema.mainEntity).not.toHaveProperty("@context");
  });

  it("describes a project with dates, author and only the links it has", () => {
    const schema = projectSchema({
      url: siteUrl("/projects/alpha"),
      title: "Alpha",
      summary: "",
      coverImage: "",
      technologies: ["Next.js", "Postgres"],
      githubUrl: "https://github.com/x/alpha",
      publishedAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-02-01T00:00:00Z"),
    });
    expect(schema).toMatchObject({
      "@type": "CreativeWork",
      name: "Alpha",
      keywords: "Next.js, Postgres",
      sameAs: ["https://github.com/x/alpha"],
      datePublished: "2026-01-01T00:00:00.000Z",
      dateModified: "2026-02-01T00:00:00.000Z",
      author: { "@id": SCHEMA_IDS.person },
    });
    expect(schema).not.toHaveProperty("description");
    expect(schema).not.toHaveProperty("image");
  });

  it("numbers breadcrumb items from 1", () => {
    expect(
      breadcrumbSchema([
        { name: "Home", url: "a" },
        { name: "Projects", url: "b" },
      ]).itemListElement
    ).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: "a" },
      { "@type": "ListItem", position: 2, name: "Projects", item: "b" },
    ]);
  });
});
