import { jsonLd } from "@/lib/structuredData";

/**
 * Structured data block. A plain <script> (not next/script) so the JSON-LD is
 * in the initial server HTML where non-JS crawlers can read it; data blocks
 * are exempt from CSP script-src, so no nonce is needed.
 */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />;
}
