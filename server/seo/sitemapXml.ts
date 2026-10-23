const XML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

/**
 * Next.js writes sitemap values into the XML verbatim, so a URL containing
 * "&" (common in image CDN query strings) would make the whole sitemap
 * unparseable. Values are entity-escaped here before they reach Next.js.
 */
export function xmlEscape(value: string): string {
  return value.replace(/[&<>"']/g, (char) => XML_ESCAPES[char]);
}

/**
 * Braces are not valid in a URL (RFC 3986). When they appear, the value is
 * almost always an unrendered CDN template copied from a page's source, such
 * as `poi={$this.metadata.x}`, so the image cannot be fetched.
 */
const UNRESOLVED_TEMPLATE = /[{}]/;

/**
 * Normalizes an absolute http(s) URL for a sitemap <loc>/<image:loc>, or
 * returns null for anything else (relative paths, data: URIs, typos,
 * unrendered templates), which search engines would reject.
 */
export function sitemapUrl(value: string): string | null {
  if (UNRESOLVED_TEMPLATE.test(value)) return null;
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  return xmlEscape(url.href);
}
