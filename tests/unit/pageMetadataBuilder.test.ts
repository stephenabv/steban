import { describe, expect, it } from "vitest";
import type { Metadata } from "next";
import type { SeoContent } from "@/server/domain/entities";
import { defaultOgImage, defaultSeo } from "@/config/seo";
import { PageMetadataBuilder } from "@/lib/seo/PageMetadataBuilder";

const aboutDefaults: Metadata = {
  title: "About",
  description: "Default about description",
  alternates: { canonical: "https://example.com/about" },
};

const seo = (overrides: Partial<SeoContent> = {}): SeoContent => ({
  title: "",
  description: "",
  keywords: [],
  noIndex: false,
  ...overrides,
});

describe("PageMetadataBuilder.build", () => {
  it("gives the page its own social card when nothing is saved", () => {
    const metadata = PageMetadataBuilder.build("about", aboutDefaults, null);

    expect(metadata).toMatchObject(aboutDefaults);
    expect(metadata.openGraph).toMatchObject({
      title: "About",
      description: "Default about description",
      url: "https://example.com/about",
      images: [defaultOgImage],
    });
    expect(metadata.twitter).toMatchObject({ title: "About", description: "Default about description" });
  });

  it("keeps the generated share image when only the title is overridden", () => {
    const metadata = PageMetadataBuilder.build("about", aboutDefaults, seo({ title: "About Stephen" }));

    expect(metadata.title).toBe("About Stephen");
    expect(metadata.openGraph).toMatchObject({
      title: "About Stephen",
      url: "https://example.com/about",
      siteName: defaultSeo.openGraph.siteName,
      type: "website",
      images: [defaultOgImage],
    });
  });

  it("uses the admin image when one is saved", () => {
    const metadata = PageMetadataBuilder.build(
      "about",
      aboutDefaults,
      seo({ description: "Bio", ogImageUrl: "https://cdn.example.com/about.png" })
    );

    expect(metadata.openGraph?.images).toEqual([{ url: "https://cdn.example.com/about.png" }]);
    expect(metadata.openGraph?.description).toBe("Bio");
  });

  it("mirrors overrides onto the X card so the site-wide card is not inherited", () => {
    const metadata = PageMetadataBuilder.build(
      "about",
      aboutDefaults,
      seo({ title: "About Stephen", description: "Bio", ogImageUrl: "https://cdn.example.com/about.png" })
    );

    expect(metadata.twitter).toEqual({
      card: defaultSeo.twitter.card,
      title: "About Stephen",
      description: "Bio",
      images: [{ url: "https://cdn.example.com/about.png" }],
    });
  });

  it("keeps the generated image on the X card when only text is overridden", () => {
    const metadata = PageMetadataBuilder.build("about", aboutDefaults, seo({ description: "Bio" }));

    expect(metadata.twitter).toMatchObject({ title: "About", description: "Bio", images: [defaultOgImage] });
  });

  it("keeps the page's own card when only keywords are overridden", () => {
    const metadata = PageMetadataBuilder.build("about", aboutDefaults, seo({ keywords: ["engineer"] }));

    expect(metadata.openGraph).toMatchObject({ title: "About", url: "https://example.com/about" });
    expect(metadata.keywords).toEqual(["engineer"]);
  });

  it("marks the home title absolute and applies noindex", () => {
    const metadata = PageMetadataBuilder.build("home", {}, seo({ title: "Home", noIndex: true }));

    expect(metadata.title).toEqual({ absolute: "Home" });
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});

describe("PageMetadataBuilder.withSocial", () => {
  it("uses the absolute home title and the page's canonical URL", () => {
    const metadata = PageMetadataBuilder.withSocial({
      title: { absolute: "Stephen Abueva" },
      alternates: { canonical: "https://example.com" },
    });

    expect(metadata.openGraph).toMatchObject({ title: "Stephen Abueva", url: "https://example.com" });
  });
});

describe("PageMetadataBuilder.openGraph", () => {
  it("falls back to the generated card when a project has no cover", () => {
    const og = PageMetadataBuilder.openGraph(
      { alternates: { canonical: "https://example.com/projects/demo" } },
      { title: "Demo", description: "Summary" }
    );

    expect(og.images).toEqual([defaultOgImage]);
    expect(og).toMatchObject({ url: "https://example.com/projects/demo", title: "Demo" });
  });
});

describe("PageMetadataBuilder.twitter", () => {
  it("builds a project's X card from its Open Graph fields", () => {
    const og = PageMetadataBuilder.openGraph(
      { alternates: { canonical: "https://example.com/projects/demo" } },
      { title: "Demo", description: "Summary", ogImageUrl: "https://cdn.example.com/demo.png" }
    );

    expect(PageMetadataBuilder.twitter(og)).toEqual({
      card: "summary_large_image",
      title: "Demo",
      description: "Summary",
      images: [{ url: "https://cdn.example.com/demo.png" }],
    });
  });
});
