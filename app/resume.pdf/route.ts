import type { NextRequest } from "next/server";
import { getResumeService } from "@/server/services";
import { ManagedFileResponse } from "@/server/http/ManagedFileResponse";

// Serves the currently active uploaded resume at the same public URL the site
// has always linked to, so a new upload takes effect without any URL change.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const result = await getResumeService().getActiveContent();
  if (!result.ok) {
    console.error("[resume] read failed:", result.error);
    return ManagedFileResponse.unavailable("The resume is temporarily unavailable.");
  }
  if (!result.value) return ManagedFileResponse.notFound("No resume has been published yet.");

  // Revalidate on every request so a replaced resume is served immediately,
  // while unchanged files cost only a 304.
  return ManagedFileResponse.file(request, result.value, {
    cache: "revalidate",
    disposition: request.nextUrl.searchParams.has("download") ? "attachment" : "inline",
  });
}
