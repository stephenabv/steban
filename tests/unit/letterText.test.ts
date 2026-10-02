import { describe, expect, it } from "vitest";
import { LetterLengthPolicy, LetterText } from "@/server/domain/coverLetter";

describe("LetterText", () => {
  it("round-trips bold markup", () => {
    const markup = "Built with **React** and **Next.js**.";
    expect(LetterText.toMarkup(LetterText.parseMarkup(markup))).toBe(markup);
  });

  it("keeps an unclosed marker as literal text", () => {
    expect(LetterText.parseMarkup("A **B")).toEqual([{ text: "A **B" }]);
  });

  it("never interprets markup as HTML", () => {
    const runs = LetterText.parseMarkup("<script>alert(1)</script> **x**");
    expect(runs[0]).toEqual({ text: "<script>alert(1)</script> " });
  });

  it("counts words", () => {
    expect(LetterText.wordCount("  One two\nthree  ")).toBe(3);
    expect(LetterText.wordCount("")).toBe(0);
  });
});

describe("LetterLengthPolicy", () => {
  it.each([
    ["standard", 220, "under"],
    ["standard", 240, "within"],
    ["standard", 350, "within"],
    ["standard", 351, "over"],
    ["concise", 120, "under"],
    ["concise", 180, "within"],
  ] as const)("assesses a %s letter of %i words as %s", (length, words, fit) => {
    expect(LetterLengthPolicy.assess(length, words)).toBe(fit);
  });
});
