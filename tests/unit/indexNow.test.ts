import { describe, expect, it, vi } from "vitest";
import { SITE_URL } from "@/config/site";
import { IndexNowClient, readIndexNowKey } from "@/server/seo/IndexNowClient";

const KEY = "0123456789abcdef0123456789abcdef";

function client(fetchImpl: typeof fetch) {
  return new IndexNowClient({ key: KEY, siteUrl: "https://example.com", fetch: fetchImpl });
}

describe("readIndexNowKey", () => {
  it("returns a valid key and rejects malformed ones", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(readIndexNowKey({ INDEXNOW_KEY: ` ${KEY} ` })).toBe(KEY);
    expect(readIndexNowKey({})).toBeNull();
    expect(readIndexNowKey({ INDEXNOW_KEY: "short" })).toBeNull();
    expect(readIndexNowKey({ INDEXNOW_KEY: "has spaces in it!" })).toBeNull();
  });
});

describe("IndexNowClient.fromEnv", () => {
  it("is enabled only for production deployments with a key", () => {
    expect(IndexNowClient.fromEnv({ INDEXNOW_KEY: KEY, VERCEL_ENV: "production" })).toBeInstanceOf(
      IndexNowClient
    );
    expect(
      IndexNowClient.fromEnv({ INDEXNOW_KEY: KEY, VERCEL_ENV: "preview", NODE_ENV: "production" })
    ).toBeNull();
    expect(IndexNowClient.fromEnv({ INDEXNOW_KEY: KEY, NODE_ENV: "production" })).toBeInstanceOf(
      IndexNowClient
    );
    expect(IndexNowClient.fromEnv({ INDEXNOW_KEY: KEY, NODE_ENV: "development" })).toBeNull();
    expect(IndexNowClient.fromEnv({ VERCEL_ENV: "production" })).toBeNull();
  });
});

describe("IndexNowClient.submit", () => {
  it("posts the protocol payload with absolute, de-duplicated same-host URLs", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 202 }));

    await expect(
      client(fetchImpl).submit([
        "/projects/alpha",
        "/projects/alpha",
        "/",
        "https://evil.example/x",
      ])
    ).resolves.toBe(true);

    expect(fetchImpl).toHaveBeenCalledOnce();
    const [endpoint, init] = fetchImpl.mock.calls[0];
    expect(endpoint).toBe("https://api.indexnow.org/indexnow");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toEqual({
      host: "example.com",
      key: KEY,
      keyLocation: "https://example.com/indexnow-key.txt",
      urlList: ["https://example.com/projects/alpha", "https://example.com/"],
    });
  });

  it("sends nothing when no URL belongs to the site", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    await expect(client(fetchImpl).submit(["https://other.example/"])).resolves.toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("reports rejections and network failures without throwing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(
      client(vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 422 }))).submit([
        "/",
      ])
    ).resolves.toBe(false);
    await expect(
      client(vi.fn<typeof fetch>().mockRejectedValue(new Error("offline"))).submit(["/"])
    ).resolves.toBe(false);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("targets the configured site URL from the environment", () => {
    const fromEnv = IndexNowClient.fromEnv({ INDEXNOW_KEY: KEY, VERCEL_ENV: "production" });
    expect(fromEnv?.urlsFor(["/about"])).toEqual([`${SITE_URL}/about`]);
  });
});
