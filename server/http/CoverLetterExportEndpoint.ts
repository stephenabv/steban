import "server-only";
import type { NextRequest } from "next/server";
import { CoverLetterNotFoundError } from "@/server/domain/coverLetter";
import { requireAdmin } from "@/server/security/adminGuard";
import { coverLetterIdSchema, exportFormatSchema } from "@/server/security/coverLetterSchemas";
import type { CoverLetterService } from "@/server/services/coverLetter/CoverLetterService";

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
} as const;

function problem(status: number, error: string): Response {
  return Response.json({ error }, { status, headers: PRIVATE_HEADERS });
}

/** RFC 6266 filename with an ASCII fallback; the name is slugged upstream but stays quoted-safe. */
function attachment(filename: string): string {
  const ascii = filename.replace(/[^\w.-]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

/**
 * Admin download of a saved letter. A GET with no side effects, but it still
 * re-checks the session, scopes the lookup to the owner, and refuses
 * cross-site requests so another origin can't trigger downloads.
 */
export class CoverLetterExportEndpoint {
  constructor(private readonly service: () => CoverLetterService) {}

  async download(request: NextRequest, rawId: string): Promise<Response> {
    const admin = await requireAdmin();
    if (!admin) return problem(401, "Unauthorized.");
    if (request.headers.get("sec-fetch-site") === "cross-site") return problem(403, "Forbidden.");

    const id = coverLetterIdSchema.safeParse(rawId);
    const format = exportFormatSchema.safeParse(request.nextUrl.searchParams.get("format"));
    if (!id.success) return problem(404, "Not found.");
    if (!format.success) return problem(400, "Unsupported export format.");

    const result = await this.service().export(admin.ownerId, id.data, format.data);
    if (!result.ok) {
      if (result.error instanceof CoverLetterNotFoundError) return problem(404, "Not found.");
      console.error("[cover-letter] export failed:", result.error.name);
      return problem(500, "Export failed. Please try again.");
    }

    const { bytes, mimeType, filename } = result.value;
    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: {
        ...PRIVATE_HEADERS,
        "Content-Type": mimeType,
        "Content-Disposition": attachment(filename),
        "Content-Length": String(bytes.byteLength),
      },
    });
  }
}
