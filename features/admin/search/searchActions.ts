"use server";

import { getAdminBasePath } from "@/lib/adminRoute";
import type { AdminSearchResponse } from "@/lib/search/AdminSearchResult";
import { requireAdmin } from "@/server/security/adminGuard";
import { rateLimit, rateLimitPolicies } from "@/server/security/rateLimit";
import { getAdminSearchService } from "@/server/services/search/adminSearchService.instance";

/** Searches admin records. Server Functions are public endpoints, so this re-checks the session. */
export async function searchAdminAction(query: unknown): Promise<AdminSearchResponse> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Your session has ended. Sign in again to search." };

  if (!rateLimit(`admin-search:${admin.ownerId}`, rateLimitPolicies.adminSearch).allowed) {
    return { ok: false, error: "Too many searches. Wait a moment and try again." };
  }

  const outcome = await getAdminSearchService().search(query, {
    ownerId: admin.ownerId,
    basePath: getAdminBasePath(),
  });
  if (!outcome) return { ok: true, query: "", groups: [], unavailable: [] };
  return { ok: true, ...outcome };
}
