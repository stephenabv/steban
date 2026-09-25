import type { NextRequest } from "next/server";
import { getProfilePhotoService } from "@/server/services";
import { ManagedFileAdminEndpoint } from "@/server/http/ManagedFileAdminEndpoint";

// pg requires the Node.js runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const endpoint = new ManagedFileAdminEndpoint({
  service: getProfilePhotoService,
  label: "profile photo",
  // The hero on the home page embeds the versioned photo URL.
  revalidate: ["/"],
});

export function POST(request: NextRequest) {
  return endpoint.upload(request);
}

export function DELETE(request: NextRequest) {
  return endpoint.remove(request);
}
