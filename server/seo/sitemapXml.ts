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
 * Normalizes an absolute http(s) URL for a sitemap <loc>/<image:loc>, or
 * returns null for anything else (relative paths, data: URIs, typos), which
 * search engines would reject.
 */
export function sitemapUrl(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  return xmlEscape(url.href);
}
