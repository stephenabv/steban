/**
 * A deliberately small Markdown subset for admin-authored long-form text
 * (legal pages). Parsed into a typed tree that React renders as elements —
 * no HTML string is ever produced, so authored text can't inject markup.
 *
 * Blocks:  "## Heading", "### Subheading", "- item" / "* item", "1. item",
 *          paragraphs separated by blank lines.
 * Inline:  **bold**, [label](https://… | mailto:… | /path)
 * Anything else renders as literal text.
 */

export type InlineNode =
  | { type: "text"; value: string }
  | { type: "strong"; children: InlineNode[] }
  | { type: "link"; href: string; external: boolean; children: InlineNode[] };

export type BlockNode =
  | { type: "heading"; level: 2 | 3; id: string; text: string; children: InlineNode[] }
  | { type: "paragraph"; children: InlineNode[] }
  | { type: "list"; ordered: boolean; items: InlineNode[][] };

export interface MarkupHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

const HEADING = /^(#{1,3})\s+(.+)$/;
const UNORDERED_ITEM = /^[-*]\s+(.+)$/;
const ORDERED_ITEM = /^\d{1,3}[.)]\s+(.+)$/;
const INLINE = /\*\*(.+?)\*\*|\[([^\]\n]+)\]\(([^)\s]+)\)/g;

export class Markup {
  /** Returns a safe href, or null when the target isn't an allowed scheme. */
  static safeHref(raw: string): { href: string; external: boolean } | null {
    if (raw.startsWith("/") && !raw.startsWith("//")) return { href: raw, external: false };
    if (raw.startsWith("#")) return { href: raw, external: false };
    try {
      const url = new URL(raw);
      if (url.protocol === "https:" || url.protocol === "http:") return { href: url.href, external: true };
      if (url.protocol === "mailto:") return { href: url.href, external: false };
    } catch {
      // Not an absolute URL.
    }
    return null;
  }

  static parseInline(text: string): InlineNode[] {
    const nodes: InlineNode[] = [];
    let cursor = 0;
    const pushText = (value: string) => {
      if (!value) return;
      const last = nodes[nodes.length - 1];
      if (last?.type === "text") last.value += value;
      else nodes.push({ type: "text", value });
    };

    for (const match of text.matchAll(INLINE)) {
      const start = match.index ?? 0;
      pushText(text.slice(cursor, start));
      cursor = start + match[0].length;

      if (match[1] !== undefined) {
        nodes.push({ type: "strong", children: Markup.parseInline(match[1]) });
        continue;
      }
      const target = Markup.safeHref(match[3]);
      if (target) {
        nodes.push({ type: "link", ...target, children: Markup.parseInline(match[2]) });
      } else {
        pushText(match[2]); // Disallowed scheme (e.g. javascript:): keep the label only.
      }
    }
    pushText(text.slice(cursor));
    return nodes;
  }

  static parse(source: string): BlockNode[] {
    const blocks: BlockNode[] = [];
    const slugs = new Map<string, number>();
    let paragraph: string[] = [];
    let list: { ordered: boolean; items: string[] } | null = null;

    const flushParagraph = () => {
      if (paragraph.length) blocks.push({ type: "paragraph", children: Markup.parseInline(paragraph.join(" ")) });
      paragraph = [];
    };
    const flushList = () => {
      if (list) blocks.push({ type: "list", ordered: list.ordered, items: list.items.map(Markup.parseInline) });
      list = null;
    };
    const uniqueId = (text: string) => {
      const base = Markup.slugify(text) || "section";
      const seen = slugs.get(base) ?? 0;
      slugs.set(base, seen + 1);
      return seen ? `${base}-${seen + 1}` : base;
    };

    for (const rawLine of source.replace(/\r\n?/g, "\n").split("\n")) {
      const line = rawLine.trim();
      if (!line) {
        flushParagraph();
        flushList();
        continue;
      }

      const heading = HEADING.exec(line);
      if (heading) {
        flushParagraph();
        flushList();
        // "#" maps to h2: the page title is the only h1.
        const level = heading[1].length === 3 ? 3 : 2;
        const text = Markup.plainText(Markup.parseInline(heading[2]));
        blocks.push({ type: "heading", level, id: uniqueId(text), text, children: Markup.parseInline(heading[2]) });
        continue;
      }

      const unordered = UNORDERED_ITEM.exec(line);
      const ordered = unordered ? null : ORDERED_ITEM.exec(line);
      const item = unordered ?? ordered;
      if (item) {
        flushParagraph();
        const isOrdered = ordered !== null;
        if (list && list.ordered !== isOrdered) flushList();
        list ??= { ordered: isOrdered, items: [] };
        list.items.push(item[1]);
        continue;
      }

      if (list) {
        // An indented continuation line extends the previous list item.
        if (/^\s+/.test(rawLine)) {
          list.items[list.items.length - 1] += ` ${line}`;
          continue;
        }
        flushList();
      }
      paragraph.push(line);
    }
    flushParagraph();
    flushList();
    return blocks;
  }

  static headings(blocks: readonly BlockNode[]): MarkupHeading[] {
    return blocks.flatMap((b) => (b.type === "heading" ? [{ id: b.id, text: b.text, level: b.level }] : []));
  }

  static plainText(nodes: readonly InlineNode[]): string {
    return nodes.map((n) => (n.type === "text" ? n.value : Markup.plainText(n.children))).join("");
  }

  static slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);
  }
}
