import { describe, expect, it, vi } from "vitest";
import { SearchQuery, type SearchField } from "@/lib/search/SearchQuery";
import {
  AdminSearchProvider,
  type AdminSearchContext,
  type ProviderHit,
} from "@/server/services/search/AdminSearchProvider";
import { AdminSearchService } from "@/server/services/search/AdminSearchService";
import { MessageSearchProvider } from "@/server/services/search/providers/MessageSearchProvider";
import type { ContactService } from "@/server/services/ContactService";
import type { ContactMessage } from "@/server/domain/entities";
import { PaletteCatalog } from "@/features/admin/search/paletteItems";

const ctx: AdminSearchContext = { ownerId: "admin", basePath: "/panel" };

interface Doc {
  id: string;
  title: string;
  body: string;
  at: number;
}

class DocProvider extends AdminSearchProvider<Doc> {
  readonly group = "projects" as const;
  readonly label = "Docs";

  constructor(
    private readonly docs: Doc[] | Error,
    limit?: number
  ) {
    super(limit);
  }

  protected async load(): Promise<readonly Doc[]> {
    if (this.docs instanceof Error) throw this.docs;
    return this.docs;
  }

  protected fields(d: Doc): SearchField[] {
    return [
      { text: d.title, weight: 3 },
      { text: d.body, weight: 1 },
    ];
  }

  protected toHit(d: Doc): ProviderHit {
    return { id: d.id, title: d.title, path: `/docs/${d.id}` };
  }

  protected recency(d: Doc): number {
    return d.at;
  }
}

describe("SearchQuery", () => {
  it("rejects non-strings and input shorter than two characters", () => {
    expect(SearchQuery.parse(undefined)).toBeNull();
    expect(SearchQuery.parse({ q: "abc" })).toBeNull();
    expect(SearchQuery.parse(" a ")).toBeNull();
  });

  it("normalizes whitespace, caps length and de-duplicates terms", () => {
    const query = SearchQuery.parse("  Next   next\tJS ")!;
    expect(query.text).toBe("Next next JS");
    expect(query.terms).toEqual(["next", "js"]);
    expect(SearchQuery.parse("x".repeat(500))!.text).toHaveLength(SearchQuery.MAX_LENGTH);
  });

  it("requires every term to match some field", () => {
    const query = SearchQuery.parse("portfolio react")!;
    expect(query.score([{ text: "Portfolio site", weight: 1 }])).toBe(0);
    expect(
      query.score([
        { text: "Portfolio site", weight: 1 },
        { text: "Built with React", weight: 1 },
      ])
    ).toBeGreaterThan(0);
  });

  it("ranks prefix over word-start over mid-word, and weights fields", () => {
    const query = SearchQuery.parse("port")!;
    const prefix = query.score([{ text: "Portal", weight: 1 }]);
    const wordStart = query.score([{ text: "Sea port", weight: 1 }]);
    const inside = query.score([{ text: "Support", weight: 1 }]);
    expect(prefix).toBeGreaterThan(wordStart);
    expect(wordStart).toBeGreaterThan(inside);
    expect(query.score([{ text: "Portal", weight: 3 }])).toBeGreaterThan(prefix);
  });

  it("finds a word-start match after an earlier mid-word one", () => {
    const query = SearchQuery.parse("port")!;
    expect(query.score([{ text: "support port", weight: 1 }])).toBe(
      query.score([{ text: "sea port", weight: 1 }])
    );
  });
});

describe("AdminSearchProvider", () => {
  const docs: Doc[] = [
    { id: "a", title: "Inventory app", body: "Tracks warehouse stock", at: 1 },
    { id: "b", title: "Warehouse dashboard", body: "Charts", at: 2 },
    { id: "c", title: "Blog", body: "Writing about a warehouse", at: 3 },
    { id: "d", title: "Unrelated", body: "Nothing here", at: 4 },
  ];

  it("ranks by relevance, then recency, limits results and prefixes the base path", async () => {
    const hits = await new DocProvider(docs, 2).search(SearchQuery.parse("warehouse")!, ctx);
    expect(hits.map((h) => h.id)).toEqual(["b", "c"]);
    expect(hits[0].href).toBe("/panel/docs/b");
  });
});

describe("AdminSearchService", () => {
  it("returns null for an unsearchable query without calling providers", async () => {
    const provider = new DocProvider([]);
    const spy = vi.spyOn(provider, "search");
    expect(await new AdminSearchService([provider]).search("a", ctx)).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it("reports a failing provider as unavailable and keeps the others", async () => {
    const onError = vi.fn();
    const service = new AdminSearchService(
      [
        new DocProvider(new Error("db down")),
        new DocProvider([{ id: "x", title: "Example", body: "", at: 0 }]),
      ],
      onError
    );
    const outcome = await service.search("example", ctx);
    expect(outcome?.unavailable).toEqual(["Docs"]);
    expect(outcome?.groups).toHaveLength(1);
    expect(outcome?.groups[0].hits[0].id).toBe("x");
    expect(onError).toHaveBeenCalledWith("projects", expect.any(Error));
  });

  it("omits groups with no hits", async () => {
    const outcome = await new AdminSearchService([new DocProvider([])]).search("example", ctx);
    expect(outcome).toEqual({ query: "example", groups: [], unavailable: [] });
  });
});

describe("MessageSearchProvider", () => {
  const message: ContactMessage = {
    id: "m1",
    name: "Ada Lovelace",
    email: "ada@example.com",
    subject: "Freelance project",
    message: "Secret body text",
    ip: "203.0.113.7",
    createdAt: new Date("2026-01-01"),
    read: false,
  };
  const contact = {
    getMessages: async () => ({
      ok: true as const,
      value: { items: [message], total: 1, page: 1, pageSize: 100, totalPages: 1 },
    }),
  } as unknown as ContactService;

  it("matches the body but never returns it or the sender IP", async () => {
    const [hit] = await new MessageSearchProvider(contact).search(
      SearchQuery.parse("secret")!,
      ctx
    );
    expect(hit).toEqual({
      id: "m1",
      title: "Freelance project",
      subtitle: "Ada Lovelace · ada@example.com",
      badge: "Unread",
      href: "/panel/messages?open=m1",
    });
    expect(JSON.stringify(hit)).not.toMatch(/Secret|203\.0/);
  });
});

describe("PaletteCatalog", () => {
  const catalog = new PaletteCatalog("/panel");

  it("lists quick actions and every page when the input is empty", () => {
    const sections = catalog.sections("", []);
    expect(sections.map((s) => s.id)).toEqual(["actions", "pages"]);
    expect(sections[1].items.find((i) => i.title === "Dashboard")?.href).toBe("/panel");
  });

  it("matches pages locally and appends server groups", () => {
    const sections = catalog.sections("messages", [
      {
        id: "messages",
        label: "Messages",
        hits: [{ id: "m1", title: "Hello", href: "/panel/messages?open=m1" }],
      },
    ]);
    expect(sections[0].items[0].href).toBe("/panel/messages");
    expect(sections[1]).toMatchObject({
      id: "messages",
      items: [{ key: "messages:m1", icon: "inbox" }],
    });
  });
});
