import { RESUME_LIMITS } from "@/config/uploads";
import { FilePolicy, endsNear, hasBytes, type DetectedFormat } from "./FilePolicy";

const PDF_MAGIC = Buffer.from("%PDF-");
const PDF_EOF = Buffer.from("%%EOF");
/** The EOF marker must appear near the end; incremental updates may append a little after it. */
const EOF_SEARCH_WINDOW = 2048;

/** Accepts complete PDF documents only. */
export class PdfFilePolicy extends FilePolicy {
  constructor() {
    super(RESUME_LIMITS);
  }

  protected detect(content: Buffer): DetectedFormat | string {
    if (!hasBytes(content, PDF_MAGIC)) {
      return "Only PDF files are supported. The selected file isn't a valid PDF.";
    }
    if (!endsNear(content, PDF_EOF, EOF_SEARCH_WINDOW)) {
      return "The PDF appears to be incomplete or corrupted. Please export it again and retry.";
    }
    return { contentType: "application/pdf", extension: ".pdf" };
  }
}
