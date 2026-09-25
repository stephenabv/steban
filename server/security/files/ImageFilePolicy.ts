import { PROFILE_PHOTO_LIMITS } from "@/config/uploads";
import { FilePolicy, endsNear, hasBytes, type DetectedFormat } from "./FilePolicy";

/** A raster format recognised by its signature and checked for truncation. */
interface ImageFormat extends DetectedFormat {
  matches(content: Buffer): boolean;
  isComplete(content: Buffer): boolean;
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PNG_IEND = Buffer.from("IEND");
const JPEG_SOI = Buffer.from([0xff, 0xd8, 0xff]);
const JPEG_EOI = Buffer.from([0xff, 0xd9]);
const RIFF = Buffer.from("RIFF");
const WEBP = Buffer.from("WEBP");
/** Encoders and editors sometimes pad after the end marker. */
const TRAILER_WINDOW = 1024;

const FORMATS: readonly ImageFormat[] = [
  {
    contentType: "image/png",
    extension: ".png",
    matches: (c) => hasBytes(c, PNG_SIGNATURE),
    isComplete: (c) => endsNear(c, PNG_IEND, TRAILER_WINDOW),
  },
  {
    contentType: "image/jpeg",
    extension: ".jpg",
    matches: (c) => hasBytes(c, JPEG_SOI),
    isComplete: (c) => endsNear(c, JPEG_EOI, TRAILER_WINDOW),
  },
  {
    contentType: "image/webp",
    extension: ".webp",
    matches: (c) => hasBytes(c, RIFF) && hasBytes(c, WEBP, 8),
    // The RIFF header declares the payload size; a shorter file was truncated.
    isComplete: (c) => c.length >= 12 && c.readUInt32LE(4) + 8 <= c.length,
  },
];

/**
 * Accepts JPEG, PNG and WebP photos. Everything else — notably SVG, which can
 * embed script, and HTML disguised with an image extension — is rejected.
 */
export class ImageFilePolicy extends FilePolicy {
  constructor() {
    super(PROFILE_PHOTO_LIMITS);
  }

  protected detect(content: Buffer): DetectedFormat | string {
    const format = FORMATS.find((f) => f.matches(content));
    if (!format) {
      return `Only ${this.limits.typeLabel} images are supported. The selected file isn't one of these.`;
    }
    if (!format.isComplete(content)) {
      return "The image appears to be incomplete or corrupted. Please export it again and retry.";
    }
    return { contentType: format.contentType, extension: format.extension };
  }
}
