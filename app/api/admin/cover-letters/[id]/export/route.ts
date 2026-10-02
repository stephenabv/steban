import type { NextRequest } from "next/server";
import { CoverLetterExportEndpoint } from "@/server/http/CoverLetterExportEndpoint";
import { getCoverLetterService } from "@/server/services/coverLetter/coverLetterService.instance";

// pdf-lib, docx and pg need the Node.js runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const endpoint = new CoverLetterExportEndpoint(getCoverLetterService);

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return endpoint.download(request, (await params).id);
}
