"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";

type Mutation = "publish" | "unpublish" | "remove";

interface Options {
  /** Admin Route Handler supporting PATCH `{ published }` and DELETE. */
  endpoint: string;
  /** Lower-case noun for messages, e.g. "resume". */
  label: string;
}

const SESSION_EXPIRED = "Your session has expired. Sign in again, then retry.";

/** Publish, unpublish and remove requests for a managed file, with toast feedback. */
export function useManagedFileMutations({ endpoint, label }: Options) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState<Mutation | null>(null);

  async function send(mutation: Mutation, init: RequestInit, success: string): Promise<boolean> {
    setPending(mutation);
    try {
      const res = await fetch(endpoint, init);
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(res.status === 401 ? SESSION_EXPIRED : (data.error ?? `Couldn't update the ${label} (${res.status}).`));
        return false;
      }
      toast.success(success);
      router.refresh();
      return true;
    } catch {
      toast.error(`Network error — the ${label} wasn't changed.`);
      return false;
    } finally {
      setPending(null);
    }
  }

  const patch = (published: boolean) => ({
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ published }),
  });

  return {
    pending,
    publish: (success: string) => send("publish", patch(true), success),
    unpublish: (success: string) => send("unpublish", patch(false), success),
    remove: (success: string) => send("remove", { method: "DELETE" }, success),
  };
}
