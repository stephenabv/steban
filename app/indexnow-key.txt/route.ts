import { readIndexNowKey } from "@/server/seo/IndexNowClient";

// IndexNow ownership proof: the file body must equal INDEXNOW_KEY. Submissions
// name this URL as `keyLocation` (server/seo/IndexNowClient.ts). The key is
// public by design; it only proves the submitter controls this host.
export const dynamic = "force-dynamic";

export function GET() {
  const key = readIndexNowKey();
  if (!key)
    return new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain" } });
  return new Response(key, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
