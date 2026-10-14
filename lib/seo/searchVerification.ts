import type { Metadata } from "next";

type Env = Record<string, string | undefined>;

// Verification tokens are short opaque strings; anything else is a paste error
// (e.g. the whole <meta> tag) and would render a broken tag.
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

function token(env: Env, name: string): string | undefined {
  const value = env[name]?.trim();
  if (!value) return undefined;
  if (TOKEN_PATTERN.test(value)) return value;
  console.warn(`[seo] ${name} ignored: expected only the token, not a full <meta> tag.`);
  return undefined;
}

/**
 * Ownership-verification <meta> tags for search consoles, from server env:
 * GOOGLE_SITE_VERIFICATION (Search Console "HTML tag" method),
 * BING_SITE_VERIFICATION (Bing Webmaster Tools, `msvalidate.01`) and
 * YANDEX_VERIFICATION. Unset values render nothing. A DNS TXT record on the
 * domain is the preferred method for Google; these cover the HTML-tag option.
 */
export function searchVerification(env: Env = process.env): Metadata["verification"] | undefined {
  const google = token(env, "GOOGLE_SITE_VERIFICATION");
  const bing = token(env, "BING_SITE_VERIFICATION");
  const yandex = token(env, "YANDEX_VERIFICATION");
  if (!google && !bing && !yandex) return undefined;
  return {
    ...(google ? { google } : {}),
    ...(yandex ? { yandex } : {}),
    ...(bing ? { other: { "msvalidate.01": bing } } : {}),
  };
}
