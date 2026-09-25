import type { NextRequest } from "next/server";
import { getSession } from "@/server/auth/session";
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
  const resume = result.value;
  // An unpublished resume is visible only to the signed-in admin (for preview),
  // and never cached; everyone else gets the same 404 as when none exists.
  const adminPreview = resume !== null && !resume.published && (await getSession()).isAdmin === true;
  if (!resume || (!resume.published && !adminPreview)) {
    return ManagedFileResponse.notFound("No resume has been published yet.");
  }

  // Published: revalidate on every request so a replaced or unpublished resume
  // takes effect immediately, while unchanged files cost only a 304.
  return ManagedFileResponse.file(request, resume, {
    cache: adminPreview ? "private" : "revalidate",
    disposition: request.nextUrl.searchParams.has("download") ? "attachment" : "inline",
  });
}
