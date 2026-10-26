import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_GRADIENT_STOPS,
  GRADIENT_PROPERTIES,
  buildGradientProperties,
  gradientStyle,
  normalizeHexColor,
} from "@/lib/theme/gradient";
import { appearanceSchema } from "@/server/security/contentSchemas";
import { DocumentAppearanceRepository } from "@/server/repositories/DocumentAppearanceRepository";
import { DocumentStore, type StoredDocument } from "@/server/repositories/document/DocumentStore";

class MemoryDocumentStore extends DocumentStore {
  readonly docs = new Map<string, StoredDocument<unknown>>();

  async read<T>(key: string): Promise<StoredDocument<T> | null> {
    return (this.docs.get(key) as StoredDocument<T> | undefined) ?? null;
  }

  async write<T>(key: string, data: T): Promise<StoredDocument<T>> {
    const doc = { data, updatedAt: new Date("2026-10-26T00:00:00Z") };
    this.docs.set(key, doc);
    return doc;
  }
}

describe("gradient palette", () => {
  it("normalises hex colours and rejects anything else", () => {
    expect(normalizeHexColor(" #ABC ")).toBe("#aabbcc");
    expect(normalizeHexColor("#D62976")).toBe("#d62976");
    for (const bad of ["red", "#12345", "#1234567", "d62976", "#zzzzzz", "#fff;}body{x:y", "url(x)"]) {
      expect(normalizeHexColor(bad)).toBeNull();
    }
  });

  it("keeps the shipped gradients verbatim for the default palette", () => {
    const style = gradientStyle(DEFAULT_GRADIENT_STOPS);
    expect(style[GRADIENT_PROPERTIES.cover]).toBe(
      "linear-gradient(120deg, #0866ff 0%, #4f5bd5 30%, #962fbf 55%, #d62976 78%, #fa7e1e 100%)"
    );
    expect(style[GRADIENT_PROPERTIES.ring]).toBe(
      "linear-gradient(45deg, #feda75 0%, #fa7e1e 25%, #d62976 50%, #962fbf 75%, #4f5bd5 100%)"
    );
  });

  it("falls back to the default for missing or invalid stops", () => {
    const fallback = gradientStyle(DEFAULT_GRADIENT_STOPS);
    expect(gradientStyle(null)).toEqual(fallback);
    expect(gradientStyle(["#ffffff"])).toEqual(fallback);
    expect(gradientStyle(["#ffffff", "red"])).toEqual(fallback);
  });

  it("spreads custom stops evenly on every surface, the cover reversed", () => {
    const style = gradientStyle(["#00ff00", "#0000ff", "#ff0000"]);
    expect(style).toEqual(buildGradientProperties(["#00ff00", "#0000ff", "#ff0000"]));
    expect(style[GRADIENT_PROPERTIES.ring]).toBe("linear-gradient(45deg, #00ff00 0%, #0000ff 50%, #ff0000 100%)");
    expect(style[GRADIENT_PROPERTIES.rule]).toBe("linear-gradient(90deg, #00ff00 0%, #0000ff 50%, #ff0000 100%)");
    expect(style[GRADIENT_PROPERTIES.cover]).toBe("linear-gradient(120deg, #ff0000 0%, #0000ff 50%, #00ff00 100%)");
  });
});

describe("appearanceSchema", () => {
  it("accepts 2–6 hex colours and normalises them", () => {
    const parsed = appearanceSchema.safeParse({ gradientStops: ["#FFF", "#123456"] });
    expect(parsed.success && parsed.data.gradientStops).toEqual(["#ffffff", "#123456"]);
  });

  it("rejects too few, too many and non-hex colours with field paths", () => {
    expect(appearanceSchema.safeParse({ gradientStops: ["#ffffff"] }).success).toBe(false);
    expect(appearanceSchema.safeParse({ gradientStops: Array(7).fill("#ffffff") }).success).toBe(false);
    const bad = appearanceSchema.safeParse({ gradientStops: ["#ffffff", "#000;}html{display:none"] });
    expect(bad.success).toBe(false);
    expect(bad.error?.issues[0].path).toEqual(["gradientStops", 1]);
  });
});

describe("DocumentAppearanceRepository", () => {
  let store: MemoryDocumentStore;
  let repo: DocumentAppearanceRepository;

  beforeEach(() => {
    store = new MemoryDocumentStore();
    repo = new DocumentAppearanceRepository(store);
  });

  it("returns null until something is saved, then round-trips the stops", async () => {
    expect(await repo.get()).toBeNull();
    await repo.save({ gradientStops: ["#111111", "#222222"] });
    expect((await repo.get())?.gradientStops).toEqual(["#111111", "#222222"]);
  });

  it("revives a corrupted record as the default palette", async () => {
    store.docs.set("appearance", { data: { gradientStops: ["javascript:alert(1)", "#fff"] }, updatedAt: new Date() });
    expect((await repo.get())?.gradientStops).toEqual([...DEFAULT_GRADIENT_STOPS]);
  });
});

describe("saveAppearanceAction", () => {
  it("refuses to save without an admin session", async () => {
    vi.resetModules();
    const save = vi.fn();
    vi.doMock("next/cache", () => ({ revalidatePath: vi.fn() }));
    vi.doMock("@/server/auth/session", () => ({ getSession: async () => ({ isAdmin: false }) }));
    vi.doMock("@/server/services", () => ({ getAppearanceService: () => ({ save }) }));
    vi.doMock("@/server/seo/searchEngineNotifier", () => ({ notifySearchEngines: vi.fn() }));

    const { saveAppearanceAction } = await import("@/features/admin/contentActions");
    const result = await saveAppearanceAction({ gradientStops: ["#111111", "#222222"] });

    expect(result.ok).toBe(false);
    expect(save).not.toHaveBeenCalled();
  });

  it("saves validated stops for an admin", async () => {
    vi.resetModules();
    const save = vi.fn(async (content) => ({ ok: true, value: { ...content, updatedAt: new Date() } }));
    vi.doMock("next/cache", () => ({ revalidatePath: vi.fn() }));
    vi.doMock("@/server/auth/session", () => ({ getSession: async () => ({ isAdmin: true }) }));
    vi.doMock("@/server/services", () => ({ getAppearanceService: () => ({ save }) }));
    vi.doMock("@/server/seo/searchEngineNotifier", () => ({ notifySearchEngines: vi.fn() }));

    const { saveAppearanceAction } = await import("@/features/admin/contentActions");
    const result = await saveAppearanceAction({ gradientStops: ["#ABC", "#222222"] });

    expect(result.ok).toBe(true);
    expect(save).toHaveBeenCalledWith({ gradientStops: ["#aabbcc", "#222222"] });
  });
});
