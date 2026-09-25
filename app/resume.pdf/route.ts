import type { NextRequest } from "next/server";
import { getResumeService } from "@/server/services";

// Serves the currently active uploaded resume at the same public URL the site
// has always linked to, so a new upload takes effect without any URL change.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** RFC 6266 filename parameters: ASCII fallback plus UTF-8 original. */
function contentDisposition(type: "inline" | "attachment", fileName: string): string {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_");
  return `${type}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export async function GET(request: NextRequest) {
  const result = await getResumeService().getActiveContent();

  if (!result.ok) {
    console.error("[resume] read failed:", result.error);
    return new Response("The resume is temporarily unavailable.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  const resume = result.value;
  if (!resume) {
    return new Response("No resume has been published yet.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  const etag = `"${resume.sha256}"`;
  // Revalidate on every request so a replaced resume is served immediately,
  // while unchanged files cost only a 304.
  const cacheHeaders = { ETag: etag, "Cache-Control": "public, max-age=0, must-revalidate" };
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers: cacheHeaders });
  }

  const disposition = request.nextUrl.searchParams.has("download") ? "attachment" : "inline";
  return new Response(new Uint8Array(resume.content), {
    status: 200,
    headers: {
      ...cacheHeaders,
      "Content-Type": resume.contentType,
      "Content-Length": String(resume.sizeBytes),
      "Content-Disposition": contentDisposition(disposition, resume.fileName),
      "Last-Modified": resume.uploadedAt.toUTCString(),
    },
  });
}
