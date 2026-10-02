import { describe, expect, it } from "vitest";
import { inflateRawSync } from "node:zlib";
import type { CoverLetterSections } from "@/server/domain/coverLetter";
import { DocxExporter } from "@/server/services/coverLetter/exporters/DocxExporter";
import { PdfExporter } from "@/server/services/coverLetter/exporters/PdfExporter";
import { PlainTextExporter } from "@/server/services/coverLetter/exporters/PlainTextExporter";
import { CoverLetterExporterRegistry } from "@/server/services/coverLetter/exporters/CoverLetterExporterRegistry";

const sections: CoverLetterSections = {
  header: { fullName: "Stephen Abueva", lines: ["stephen@example.com", "steban.vercel.app"] },
  date: "October 2, 2026",
  recipient: ["Hiring Manager", "Acme Corp"],
  salutation: "Dear Hiring Manager,",
  body: [
    [
      { text: "I am applying for the " },
      { text: "Frontend Engineer", bold: true },
      { text: " role." },
    ],
    [{ text: "I work with React — and ünïcode “quotes”." }],
    [{ text: "Thank you for reading." }],
  ],
  closing: ["Thank you for your time and consideration.", "Sincerely,"],
  signature: "Stephen Abueva",
};
const input = { sections, companyName: "Acme Corp", positionTitle: "Frontend Engineer" };

/** Reads one stored or deflated entry out of a zip archive. */
function zipEntry(bytes: Uint8Array, name: string): string {
  const buffer = Buffer.from(bytes);
  for (let offset = 0; offset < buffer.length - 30; offset++) {
    if (buffer.readUInt32LE(offset) !== 0x04034b50) continue;
    const method = buffer.readUInt16LE(offset + 8);
    const size = buffer.readUInt32LE(offset + 18);
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    if (buffer.toString("utf8", offset + 30, offset + 30 + nameLength) !== name) continue;
    const start = offset + 30 + nameLength + extraLength;
    const data = buffer.subarray(start, start + size);
    return (method === 8 ? inflateRawSync(data) : data).toString("utf8");
  }
  throw new Error(`${name} not found`);
}

describe("cover letter exporters", () => {
  it("exports plain text in reading order", async () => {
    const file = await new PlainTextExporter().export(input);
    const text = Buffer.from(file.bytes).toString("utf8");

    expect(file.mimeType).toBe("text/plain; charset=utf-8");
    expect(file.filename).toBe("stephen-abueva_acme-corp_frontend-engineer.txt");
    expect(text.indexOf("Stephen Abueva")).toBe(0);
    expect(text).toContain("I am applying for the Frontend Engineer role.");
    expect(text.trimEnd().endsWith("Sincerely,\nStephen Abueva")).toBe(true);
  });

  it("exports a PDF, replacing characters the font cannot draw", async () => {
    const file = await new PdfExporter().export(input);
    expect(Buffer.from(file.bytes.subarray(0, 5)).toString("latin1")).toBe("%PDF-");
    expect(file.mimeType).toBe("application/pdf");
    expect(file.filename.endsWith(".pdf")).toBe(true);
  });

  it("exports a DOCX with bold runs", async () => {
    const file = await new DocxExporter().export(input);
    expect(Buffer.from(file.bytes.subarray(0, 2)).toString("latin1")).toBe("PK");
    const xml = zipEntry(file.bytes, "word/document.xml");
    expect(xml).toContain("Frontend Engineer");
    expect(xml).toMatch(/<w:b\/>[\s\S]*Frontend Engineer/);
    expect(xml).toContain("Stephen Abueva");
  });

  it("keeps filenames safe whatever the company name", async () => {
    const file = await new PlainTextExporter().export({ ...input, companyName: '../"Evil"\r\nCo' });
    expect(file.filename).toMatch(/^[a-z0-9_-]+\.txt$/);
  });

  it("looks exporters up by format", () => {
    const registry = new CoverLetterExporterRegistry([new PlainTextExporter()]);
    expect(registry.get("txt")).toBeInstanceOf(PlainTextExporter);
    expect(() => registry.get("pdf")).toThrow();
  });
});
