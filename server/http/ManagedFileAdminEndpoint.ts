import "server-only";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/server/auth/session";
import { z } from "zod";
import {
  FileValidationError,
  ManagedFileError,
  ManagedFileMissingError,
  type ManagedFileService,
} from "@/server/services";
import { formatBytes } from "@/lib/formatBytes";
import { toManagedFileSummary } from "@/lib/files/ManagedFileSummary";

/** Multipart framing overhead allowed on top of the file itself. */
const MULTIPART_OVERHEAD = 64 * 1024;

export interface ManagedFileAdminEndpointOptions {
  /** Resolved lazily so the singleton is created on first request, not at import. */
  service: () => ManagedFileService;
  /** Lower-case noun used in messages and logs, e.g. "resume". */
  label: string;
  /** Public pages that render something derived from the file. */
  revalidate: readonly string[];
}

const publishBodySchema = z.object({ published: z.boolean() }).strict();

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

/**
 * Admin HTTP surface for a managed file. Binary uploads use Route Handlers
 * (not Server Actions) because Server Actions cap request bodies at 1 MB.
 *
 * Route Handlers are public HTTP endpoints, so every method re-checks the
 * session and origin instead of relying on the proxy alone.
 */
export class ManagedFileAdminEndpoint {
  constructor(private readonly options: ManagedFileAdminEndpointOptions) {}

  private async authorize(request: NextRequest): Promise<Response | null> {
    const session = await getSession();
    if (!session.isAdmin) return json(401, { error: "Unauthorized." });
    if (!isSameOrigin(request)) return json(403, { error: "Forbidden." });
    return null;
  }

  private revalidate(): void {
    for (const path of this.options.revalidate) revalidatePath(path);
  }

  async upload(request: NextRequest): Promise<Response> {
    const denied = await this.authorize(request);
    if (denied) return denied;

    const service = this.options.service();
    const { maxBytes, typeLabel } = service.policy.limits;
    const tooLarge = `The file is too large. The maximum size is ${formatBytes(maxBytes)}.`;

    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (declaredLength > maxBytes + MULTIPART_OVERHEAD) return json(413, { error: tooLarge });

    let file: FormDataEntryValue | null;
    try {
      file = (await request.formData()).get("file");
    } catch {
      return json(400, { error: "The upload couldn't be read. Please try again." });
    }
    if (!(file instanceof File)) return json(400, { error: `Choose a ${typeLabel} file to upload.` });
    // Chunked bodies carry no Content-Length; enforce the limit before buffering.
    if (file.size > maxBytes) return json(413, { error: tooLarge });

    const result = await service.upload(file.name, Buffer.from(await file.arrayBuffer()));
    if (!result.ok) {
      if (result.error instanceof FileValidationError) return json(422, { error: result.error.message });
      console.error(`[${this.options.label}] upload failed:`, result.error);
      return json(500, { error: `The ${this.options.label} couldn't be saved. Your current ${this.options.label} is unchanged.` });
    }

    this.revalidate();
    return json(200, { ok: true, file: toManagedFileSummary(result.value) });
  }

  /** PATCH `{ "published": boolean }` — shows or hides the file on the public site. */
  async setPublished(request: NextRequest): Promise<Response> {
    const denied = await this.authorize(request);
    if (denied) return denied;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json(400, { error: "Invalid request." });
    }
    const parsed = publishBodySchema.safeParse(body);
    if (!parsed.success) return json(400, { error: "Invalid request." });

    const result = await this.options.service().setPublished(parsed.data.published);
    if (!result.ok) {
      if (result.error instanceof ManagedFileMissingError) return json(404, { error: result.error.message });
      if (result.error instanceof ManagedFileError) return json(409, { error: result.error.message });
      console.error(`[${this.options.label}] publish change failed:`, result.error);
      return json(500, { error: `The ${this.options.label} couldn't be updated. Please try again.` });
    }

    this.revalidate();
    return json(200, { ok: true, file: toManagedFileSummary(result.value) });
  }

  async remove(request: NextRequest): Promise<Response> {
    const denied = await this.authorize(request);
    if (denied) return denied;

    const result = await this.options.service().remove();
    if (!result.ok) {
      console.error(`[${this.options.label}] remove failed:`, result.error);
      return json(500, { error: `The ${this.options.label} couldn't be removed. Please try again.` });
    }

    this.revalidate();
    return json(200, { ok: true, removed: result.value });
  }
}
