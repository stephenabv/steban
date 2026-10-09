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
  it("returns the page defaults untouched when nothing is saved", () => {
    expect(PageMetadataBuilder.build("about", aboutDefaults, null)).toBe(aboutDefaults);
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

  it("leaves openGraph to the root layout when no share field is overridden", () => {
    const metadata = PageMetadataBuilder.build("about", aboutDefaults, seo({ keywords: ["engineer"] }));

    expect(metadata.openGraph).toBeUndefined();
    expect(metadata.keywords).toEqual(["engineer"]);
  });

  it("marks the home title absolute and applies noindex", () => {
    const metadata = PageMetadataBuilder.build("home", {}, seo({ title: "Home", noIndex: true }));

    expect(metadata.title).toEqual({ absolute: "Home" });
    expect(metadata.robots).toEqual({ index: false, follow: true });
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
