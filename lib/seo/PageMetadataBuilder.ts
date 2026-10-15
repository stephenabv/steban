import type { Metadata } from "next";
import type { SeoContent, SeoPageKey } from "@/server/domain/entities";
import { defaultOgImage, defaultSeo } from "@/config/seo";

type OpenGraph = NonNullable<Metadata["openGraph"]>;
type Twitter = NonNullable<Metadata["twitter"]>;

/**
 * Applies admin SEO overrides on top of a page's default metadata.
 *
 * Next.js merges metadata shallowly per segment: a page that sets `openGraph`
 * replaces the root layout's object, including the generated card from
 * app/opengraph-image.tsx. Any page-level `openGraph` built here therefore
 * carries the site-wide fields and an image, so a share preview never loses
 * its picture just because a title or description was overridden.
 *
 * The same applies to `twitter`: the root layout sets a site-wide X card, and
 * Next.js only derives X fields from Open Graph when no `twitter` title or
 * description is inherited. Pages that override Open Graph therefore also get
 * a matching `twitter` object, or X would keep showing the site-wide card.
 */
export class PageMetadataBuilder {
  static build(pageKey: SeoPageKey, defaults: Metadata, seo: SeoContent | null): Metadata {
    if (!seo) return defaults;

    const metadata: Metadata = { ...defaults };
    if (seo.title) metadata.title = pageKey === "home" ? { absolute: seo.title } : seo.title;
    if (seo.description) metadata.description = seo.description;
    if (seo.keywords.length > 0) metadata.keywords = seo.keywords;
    if (seo.title || seo.description || seo.ogImageUrl) {
      metadata.openGraph = PageMetadataBuilder.openGraph(defaults, seo);
      metadata.twitter = PageMetadataBuilder.twitter(metadata.openGraph);
    }
    if (seo.noIndex) metadata.robots = { index: false, follow: true };
    return metadata;
  }

  /** Site-wide Open Graph fields with the page's canonical URL, defaults and overrides layered on. */
  static openGraph(defaults: Metadata, seo: Partial<SeoContent> = {}): OpenGraph {
    const base = defaults.openGraph ?? {};
    const canonical = defaults.alternates?.canonical;
    return {
      type: defaultSeo.openGraph.type,
      locale: defaultSeo.openGraph.locale,
      siteName: defaultSeo.openGraph.siteName,
      ...(typeof canonical === "string" ? { url: canonical } : {}),
      ...base,
      ...(seo.title ? { title: seo.title } : {}),
      ...(seo.description ? { description: seo.description } : {}),
      images: seo.ogImageUrl ? [{ url: seo.ogImageUrl }] : (base.images ?? [defaultOgImage]),
    };
  }

  /** An X card mirroring a page's Open Graph title, description and image. */
  static twitter(openGraph: OpenGraph): Twitter {
    return {
      card: defaultSeo.twitter.card,
      ...(openGraph.title ? { title: openGraph.title } : {}),
      ...(openGraph.description ? { description: openGraph.description } : {}),
      ...(openGraph.images ? { images: openGraph.images } : {}),
    };
  }
}
