import { getProfilePhotoService, ProfilePhotoService } from "@/server/services";
import { ManagedFileResponse } from "@/server/http/ManagedFileResponse";

// pg requires the Node.js runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves the active profile photo. The path segment is the content-hash version
 * produced by ProfilePhotoService.publicPath: a matching version is immutable
 * and cached forever; a stale one (e.g. from a cached page) gets the current
 * photo with revalidation so it never pins an outdated image.
 */
export async function GET(request: Request, ctx: { params: Promise<{ version: string }> }) {
  const [{ version }, result] = await Promise.all([ctx.params, getProfilePhotoService().getActiveContent()]);
  if (!result.ok) {
    console.error("[profile photo] read failed:", result.error);
    return ManagedFileResponse.unavailable("The profile photo is temporarily unavailable.");
  }
  const photo = result.value;
  if (!photo || !photo.published) return ManagedFileResponse.notFound("No profile photo has been published.");

  return ManagedFileResponse.file(request, photo, {
    cache: version === ProfilePhotoService.version(photo) ? "immutable" : "revalidate",
  });
}
