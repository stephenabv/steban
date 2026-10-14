import { SITE_URL } from "@/config/site";

type Env = Record<string, string | undefined>;
type Fetch = typeof fetch;

/** Public path of the key file; must be on the site's own host. */
export const INDEXNOW_KEY_PATH = "/indexnow-key.txt";

const DEFAULT_ENDPOINT = "https://api.indexnow.org/indexnow";
// Protocol: 8-128 characters of a-z, A-Z, 0-9 and "-".
const KEY_PATTERN = /^[A-Za-z0-9-]{8,128}$/;
const REQUEST_TIMEOUT_MS = 5000;
// Protocol limit per request.
const MAX_URLS = 10_000;

export interface IndexNowConfig {
  key: string;
  /** Canonical site origin, e.g. https://stephenabueva.dev. */
  siteUrl: string;
  endpoint?: string;
  fetch?: Fetch;
}

/**
 * Reads INDEXNOW_KEY. Returns null (with a warning) for a malformed key, so a
 * typo disables the feature instead of serving a key engines would reject.
 */
export function readIndexNowKey(env: Env = process.env): string | null {
  const key = env.INDEXNOW_KEY?.trim();
  if (!key) return null;
  if (KEY_PATTERN.test(key)) return key;
  console.warn("[indexnow] INDEXNOW_KEY ignored: use 8-128 letters, digits or hyphens.");
  return null;
}

/**
 * Notifies IndexNow-enabled search engines (Bing, Yandex, Seznam, Naver, ...)
 * that public URLs changed, so they recrawl in minutes instead of waiting for
 * the next sitemap fetch. Google does not use IndexNow; it reads the sitemap.
 * https://www.bing.com/indexnow/getstarted
 *
 * Best effort: failures are logged and never thrown, because a search-engine
 * outage must not fail the admin save that triggered the notification.
 */
export class IndexNowClient {
  private readonly origin: URL;
  private readonly endpoint: string;
  private readonly fetchImpl: Fetch;

  constructor(private readonly config: IndexNowConfig) {
    this.origin = new URL(config.siteUrl);
    this.endpoint = config.endpoint ?? DEFAULT_ENDPOINT;
    this.fetchImpl = config.fetch ?? fetch;
  }

  /**
   * The client for this deployment, or null when notifications are off: no
   * valid key, or not a production deployment (previews and local builds
   * would otherwise announce production URLs for content they don't serve).
   */
  static fromEnv(env: Env = process.env): IndexNowClient | null {
    const key = readIndexNowKey(env);
    if (!key) return null;
    const isProduction = env.VERCEL_ENV
      ? env.VERCEL_ENV === "production"
      : env.NODE_ENV === "production";
    return isProduction ? new IndexNowClient({ key, siteUrl: SITE_URL }) : null;
  }

  /** Absolute, de-duplicated URLs on the site's own host; others are dropped. */
  urlsFor(paths: readonly string[]): string[] {
    const urls = new Set<string>();
    for (const path of paths) {
      const url = new URL(path, this.origin);
      if (url.host === this.origin.host) urls.add(url.href);
    }
    return [...urls].slice(0, MAX_URLS);
  }

  async submit(paths: readonly string[]): Promise<boolean> {
    const urlList = this.urlsFor(paths);
    if (urlList.length === 0) return false;

    try {
      const response = await this.fetchImpl(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          host: this.origin.host,
          key: this.config.key,
          keyLocation: new URL(INDEXNOW_KEY_PATH, this.origin).href,
          urlList,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      // 200 = accepted, 202 = accepted pending key validation.
      if (response.ok) return true;
      console.warn(`[indexnow] submission rejected with HTTP ${response.status}.`);
    } catch (e) {
      console.warn("[indexnow] submission failed:", e instanceof Error ? e.message : e);
    }
    return false;
  }
}
