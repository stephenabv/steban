import "server-only";
import type { ManagedFileContent } from "@/server/domain/entities";

export type CachePolicy =
  /** Revalidate every request: the URL is stable while the content changes. */
  | "revalidate"
  /** Cache forever: the URL changes whenever the content does. */
  | "immutable";

export interface ManagedFileResponseOptions {
  cache: CachePolicy;
  disposition?: "inline" | "attachment";
}

const CACHE_CONTROL: Record<CachePolicy, string> = {
  revalidate: "public, max-age=0, must-revalidate",
  immutable: "public, max-age=31536000, immutable",
};

const TEXT_HEADERS = { "Content-Type": "text/plain; charset=utf-8" };

/** RFC 6266 filename parameters: ASCII fallback plus UTF-8 original. */
function contentDisposition(type: "inline" | "attachment", fileName: string): string {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_");
  return `${type}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

/** Builds HTTP responses for publicly served managed files. */
export class ManagedFileResponse {
  /** Streams the file with a content-hash ETag; conditional requests get a 304. */
  static file(request: Request, file: ManagedFileContent, options: ManagedFileResponseOptions): Response {
    const etag = `"${file.sha256}"`;
    const cacheHeaders = { ETag: etag, "Cache-Control": CACHE_CONTROL[options.cache] };
    if (request.headers.get("if-none-match") === etag) {
      return new Response(null, { status: 304, headers: cacheHeaders });
    }

    return new Response(new Uint8Array(file.content), {
      status: 200,
      headers: {
        ...cacheHeaders,
        "Content-Type": file.contentType,
        "Content-Length": String(file.sizeBytes),
        "Content-Disposition": contentDisposition(options.disposition ?? "inline", file.fileName),
        "Last-Modified": file.uploadedAt.toUTCString(),
      },
    });
  }

  static notFound(message: string): Response {
    return new Response(message, { status: 404, headers: { ...TEXT_HEADERS, "Cache-Control": "no-store" } });
  }

  static unavailable(message: string): Response {
    return new Response(message, { status: 503, headers: { ...TEXT_HEADERS, "Cache-Control": "no-store" } });
  }
}
