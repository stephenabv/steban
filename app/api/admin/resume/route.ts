import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/server/auth/session";
import { getResumeService, ResumeValidationError } from "@/server/services";
import { RESUME_POLICY } from "@/server/security/resumeFilePolicy";
import { formatBytes } from "@/lib/formatBytes";

// Binary upload handled in a Route Handler (not a Server Action) because Server
// Actions cap request bodies at 1 MB. pg requires the Node.js runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Multipart framing overhead allowed on top of the file itself. */
const MULTIPART_OVERHEAD = 64 * 1024;

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status });
}

/** Same-origin check — defence in depth on top of the SameSite=Lax session cookie. */
function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  // Route Handlers are public HTTP endpoints — never rely on the proxy alone.
  const session = await getSession();
  if (!session.isAdmin) return json(401, { error: "Unauthorized." });
  if (!isSameOrigin(request)) return json(403, { error: "Forbidden." });

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > RESUME_POLICY.maxBytes + MULTIPART_OVERHEAD) {
    return json(413, {
      error: `The file is too large. The maximum size is ${formatBytes(RESUME_POLICY.maxBytes)}.`,
    });
  }

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return json(400, { error: "The upload couldn't be read. Please try again." });
  }
  if (!(file instanceof File)) {
    return json(400, { error: "Choose a PDF file to upload." });
  }

  const content = Buffer.from(await file.arrayBuffer());
  const result = await getResumeService().upload(file.name, content);

  if (!result.ok) {
    if (result.error instanceof ResumeValidationError) {
      return json(422, { error: result.error.message });
    }
    console.error("[resume] upload failed:", result.error);
    return json(500, { error: "The resume couldn't be saved. Your current resume is unchanged." });
  }

  // The home page renders the Resume button only when a resume exists.
  revalidatePath("/");
  const { id, fileName, sizeBytes, sha256, uploadedAt } = result.value;
  return json(200, { ok: true, resume: { id, fileName, sizeBytes, sha256, uploadedAt: uploadedAt.toISOString() } });
}
