"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markMessageReadAction, deleteMessageAction } from "./messageActions";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";
import styles from "./AdminPage.module.less";
import modalStyles from "@/components/ui/Modal.module.less";

export interface InboxMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string; // ISO — serialized across the server/client boundary
  read: boolean;
}

export function MessagesInbox({ messages }: { messages: InboxMessage[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [viewMessage, setViewMessage] = useState<InboxMessage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InboxMessage | null>(null);

  function onView(m: InboxMessage) {
    setViewMessage(m);
    if (!m.read) {
      startTransition(async () => {
        const result = await markMessageReadAction(m.id);
        if (!result.ok) {
          toast.error(result.error ?? "Failed to mark message as read.");
          return;
        }
        router.refresh();
      });
    }
  }

  function onConfirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      const result = await deleteMessageAction(target.id);
      if (!result.ok) {
        toast.error(result.error ?? "Failed to delete message.");
        return;
      }
      toast.success("Message deleted.");
      if (viewMessage?.id === target.id) setViewMessage(null);
      setDeleteTarget(null);
      router.refresh();
    });
  }

  if (messages.length === 0) {
    return (
      <p
        style={{
          color: "var(--color-text-muted, #606075)",
          textAlign: "center",
          padding: "3rem",
        }}
      >
        No messages yet.
      </p>
    );
  }

  return (
    <>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>From</th>
              <th className={styles.th}>Subject</th>
              <th className={styles.th}>Date</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((m) => (
              <tr key={m.id}>
                <td className={styles.td}>
                  <div>
                    <div>{m.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted, #606075)" }}>
                      {m.email}
                    </div>
                  </div>
                </td>
                <td className={styles.td}>{m.subject}</td>
                <td className={styles.td}>{new Date(m.createdAt).toLocaleDateString()}</td>
                <td className={styles.td}>
                  <span className={`${styles.tableBadge} ${m.read ? styles.inactive : styles.active}`}>
                    {m.read ? "Read" : "Unread"}
                  </span>
                </td>
                <td className={styles.td}>
                  <div className={styles.tableActions}>
                    <button className={styles.tableActionBtn} type="button" onClick={() => onView(m)}>
                      View
                    </button>
                    <button
                      className={`${styles.tableActionBtn} ${styles.danger}`}
                      type="button"
                      onClick={() => setDeleteTarget(m)}
                      disabled={pending}
                      aria-busy={pending}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={viewMessage !== null}
        onClose={() => setViewMessage(null)}
        title={viewMessage ? `Message from ${viewMessage.name}` : ""}
        footer={
          viewMessage && (
            <button
              type="button"
              className={modalStyles.btnDanger}
              onClick={() => setDeleteTarget(viewMessage)}
            >
              Delete
            </button>
          )
        }
      >
        {viewMessage && (
          <div>
            <p>
              <strong>Subject:</strong> {viewMessage.subject}
            </p>
            <p>
              <strong>Received:</strong> {new Date(viewMessage.createdAt).toLocaleString()}
            </p>
            <p style={{ marginTop: "1rem", whiteSpace: "pre-wrap" }}>{viewMessage.message}</p>
            <p style={{ marginTop: "1rem" }}>
              <a href={`mailto:${viewMessage.email}?subject=Re: ${encodeURIComponent(viewMessage.subject)}`}>
                Reply to {viewMessage.email}
              </a>
            </p>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete message"
        message={deleteTarget ? `Delete the message from ${deleteTarget.name}? This cannot be undone.` : ""}
        confirmLabel="Delete"
        danger
        busy={pending}
        onConfirm={onConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
