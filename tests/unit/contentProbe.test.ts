import { describe, expect, it } from "vitest";
import { isContentElement, isPaintedColor, type ProbeElement, type ProbeStyle } from "@/lib/backdrop/contentProbe";

const TEXT = 3;
const ELEMENT = 1;

function el(tagName: string, opts: { text?: string; matches?: boolean } = {}): ProbeElement {
  return {
    tagName,
    childNodes: opts.text === undefined ? [] : [{ nodeType: TEXT, textContent: opts.text }],
    matches: () => opts.matches ?? false,
  };
}

const unpainted: ProbeStyle = { backgroundColor: "rgba(0, 0, 0, 0)", backgroundImage: "none" };
const style = (s: Partial<ProbeStyle> = {}) => () => ({ ...unpainted, ...s });

describe("isPaintedColor", () => {
  it.each([
    ["transparent", false],
    ["rgba(0, 0, 0, 0)", false],
    ["rgb(0 0 0 / 0%)", false],
    ["rgb(11, 14, 13)", true],
    ["rgba(59, 234, 98, 0.12)", true],
    ["rgb(59 234 98 / 50%)", true],
    ["#0b0e0d", true],
  ])("%s -> %s", (color, painted) => {
    expect(isPaintedColor(color)).toBe(painted);
  });
});

describe("isContentElement", () => {
  it("treats nothing, the root and <main> as empty canvas", () => {
    expect(isContentElement(null, style())).toBe(false);
    expect(isContentElement(el("HTML"), style({ backgroundColor: "rgb(5, 7, 6)" }))).toBe(false);
    expect(isContentElement(el("BODY", { text: "stray" }), style({ backgroundColor: "rgb(5, 7, 6)" }))).toBe(false);
    expect(isContentElement(el("MAIN"), style())).toBe(false);
  });

  it("counts controls, media and links as content", () => {
    expect(isContentElement(el("A", { matches: true }), style())).toBe(true);
  });

  it("counts an element with its own visible text", () => {
    expect(isContentElement(el("P", { text: "Hello" }), style())).toBe(true);
  });

  it("ignores whitespace-only and non-text children", () => {
    const wrapper: ProbeElement = {
      tagName: "DIV",
      childNodes: [
        { nodeType: TEXT, textContent: "\n   " },
        { nodeType: ELEMENT, textContent: "nested text belongs to the child" },
      ],
      matches: () => false,
    };
    expect(isContentElement(wrapper, style())).toBe(false);
  });

  it("counts painted surfaces such as panels and bands", () => {
    expect(isContentElement(el("DIV"), style({ backgroundColor: "rgb(11, 14, 13)" }))).toBe(true);
    expect(isContentElement(el("SECTION"), style({ backgroundImage: "linear-gradient(red, blue)" }))).toBe(true);
  });

  it("treats a bare layout wrapper as empty canvas", () => {
    expect(isContentElement(el("DIV"), style())).toBe(false);
  });
});
