"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProjectAction } from "./projectActions";
import styles from "./AdminPage.module.less";

export function DeleteProjectButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const result = await deleteProjectAction(id);
      if (!result.ok) {
        window.alert(result.error ?? "Failed to delete project.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      className={`${styles.tableActionBtn} ${styles.danger}`}
      type="button"
      onClick={onDelete}
      disabled={busy}
      aria-busy={busy}
    >
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
