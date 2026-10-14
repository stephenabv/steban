"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/security/adminGuard";
import { getPasskeyService } from "@/server/auth/passkeys";
import { AuditService } from "@/server/services/AuditService";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const MAX_ID_LENGTH = 1024;

export async function deletePasskeyAction(id: string): Promise<ActionResult> {
  // Server Functions are public HTTP endpoints — never rely on the proxy alone.
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Unauthorized." };
  if (typeof id !== "string" || id.length === 0 || id.length > MAX_ID_LENGTH) {
    return { ok: false, error: "Passkey not found." };
  }

  try {
    const removed = await getPasskeyService().remove(admin.ownerId, id);
    if (!removed) return { ok: false, error: "Passkey not found." };
  } catch (e) {
    console.error("[passkeys] delete failed:", (e as Error).message);
    return { ok: false, error: "Couldn't remove the passkey. Please try again." };
  }

  await new AuditService().log("delete", "passkey", { resourceId: id, actorId: admin.ownerId });
  revalidatePath("/admin/passkeys");
  return { ok: true };
}
