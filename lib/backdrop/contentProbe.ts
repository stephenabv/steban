/**
 * Decides whether a point on screen is over page content (text, a control,
 * an image or a painted surface such as a panel or button) or over empty
 * canvas. Used by the tech backdrop to fade glyphs while they cross content.
 *
 * It works on minimal structural types rather than the DOM classes so the
 * rules can be unit-tested without a browser.
 */

const TEXT_NODE = 3;

/** Elements that are content in their own right, whatever their styling. */
const CONTENT_SELECTOR = "a, button, input, textarea, select, label, img, svg, video, canvas, [role='button']";

/** Root and landmark wrappers that only lay content out, never paint it. */
const STRUCTURAL_TAGS: ReadonlySet<string> = new Set(["HTML", "BODY", "MAIN"]);

export interface ProbeNode {
  readonly nodeType: number;
  readonly textContent: string | null;
}

export interface ProbeElement {
  readonly tagName: string;
  readonly childNodes: ArrayLike<ProbeNode>;
  matches(selector: string): boolean;
}

export interface ProbeStyle {
  readonly backgroundColor: string;
  readonly backgroundImage: string;
}

export type StyleReader = (element: ProbeElement) => ProbeStyle;

/** True when a CSS colour string has a non-zero alpha channel. */
export function isPaintedColor(color: string): boolean {
  const value = color.trim().toLowerCase();
  if (value === "" || value === "transparent") return false;
  const alpha = /^rgba?\(([^)]+)\)$/.exec(value);
  if (!alpha) return true;
  const parts = alpha[1].split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 4) return true;
  const a = parts[3];
  const n = a.endsWith("%") ? Number.parseFloat(a) / 100 : Number.parseFloat(a);
  return Number.isNaN(n) ? true : n > 0;
}

function hasOwnText(element: ProbeElement): boolean {
  for (let i = 0; i < element.childNodes.length; i++) {
    const node = element.childNodes[i];
    if (node.nodeType === TEXT_NODE && node.textContent && node.textContent.trim() !== "") return true;
  }
  return false;
}

/**
 * Whether the topmost element at a point counts as content. Layout wrappers
 * (grids, flex rows, sections without a background) and the page root do not.
 */
export function isContentElement(element: ProbeElement | null, readStyle: StyleReader): boolean {
  if (!element || STRUCTURAL_TAGS.has(element.tagName.toUpperCase())) return false;
  if (element.matches(CONTENT_SELECTOR)) return true;
  if (hasOwnText(element)) return true;
  const style = readStyle(element);
  return isPaintedColor(style.backgroundColor) || (style.backgroundImage !== "" && style.backgroundImage !== "none");
}
