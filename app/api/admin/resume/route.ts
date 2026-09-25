import type { NextRequest } from "next/server";
import { getResumeService } from "@/server/services";
import { ManagedFileAdminEndpoint } from "@/server/http/ManagedFileAdminEndpoint";

// pg requires the Node.js runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const endpoint = new ManagedFileAdminEndpoint({
  service: getResumeService,
  label: "resume",
  // The home page renders the Resume button only when a resume exists.
  revalidate: ["/"],
});

export function POST(request: NextRequest) {
  return endpoint.upload(request);
}

export function PATCH(request: NextRequest) {
  return endpoint.setPublished(request);
}

export function DELETE(request: NextRequest) {
  return endpoint.remove(request);
}
