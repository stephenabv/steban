import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config";

const GOOGLEBOT_SMARTPHONE =
  "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const DESKTOP_CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

describe("next.config metadata rendering", () => {
  // Streamed metadata can land in <body> once data is slow (production), and
  // Google ignores rel="canonical" there; every user agent must get it in <head>.
  it.each([GOOGLEBOT_SMARTPHONE, DESKTOP_CHROME])("renders blocking metadata for %s", (ua) => {
    const bots = nextConfig.htmlLimitedBots;
    expect(bots).toBeInstanceOf(RegExp);
    expect((bots as RegExp).test(ua)).toBe(true);
  });
});
