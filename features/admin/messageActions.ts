"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/server/auth/session";
import { getContactService } from "@/server/services";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

async function requireAdmin(): Promise<boolean> {
  // Server Functions are public HTTP endpoints — never rely on the proxy alone.
  const session = await getSession();
  return session.isAdmin === true;
}

export async function markMessageReadAction(id: string): Promise<ActionResult> {
  if (!(await requireAdmin())) {
    return { ok: false, error: "Unauthorized." };
  }

  const result = await getContactService().markAsRead(id);
  if (!result.ok) {
    return { ok: false, error: result.error.message };
  }
  if (!result.value) {
    return { ok: false, error: "Message not found." };
  }

  revalidatePath("/admin/messages");
  return { ok: true };
}

export async function deleteMessageAction(id: string): Promise<ActionResult> {
  if (!(await requireAdmin())) {
    return { ok: false, error: "Unauthorized." };
  }

  const result = await getContactService().deleteMessage(id);
  if (!result.ok) {
    return { ok: false, error: result.error.message };
  }
  if (!result.value) {
    return { ok: false, error: "Message not found." };
  }

  revalidatePath("/admin/messages");
  return { ok: true };
}
