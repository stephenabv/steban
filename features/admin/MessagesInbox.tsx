"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markMessageReadAction, deleteMessageAction } from "./messageActions";
import styles from "./AdminPage.module.less";

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
  const [pending, startTransition] = useTransition();
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function runAction(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      router.refresh();
    });
  }

  function onView(m: InboxMessage) {
    const next = openId === m.id ? null : m.id;
    setOpenId(next);
    if (next && !m.read) {
      runAction(() => markMessageReadAction(m.id));
    }
  }

  function onDelete(m: InboxMessage) {
    if (!window.confirm(`Delete the message from ${m.name}? This cannot be undone.`)) {
      return;
    }
    if (openId === m.id) setOpenId(null);
    runAction(() => deleteMessageAction(m.id));
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
      {error && (
        <div className={styles.errorBanner} role="alert" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

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
            <MessageRow
              key={m.id}
              message={m}
              expanded={openId === m.id}
              busy={pending}
              onView={() => onView(m)}
              onDelete={() => onDelete(m)}
            />
          ))}
        </tbody>
      </table>
    </>
  );
}

function MessageRow({
  message: m,
  expanded,
  busy,
  onView,
  onDelete,
}: {
  message: InboxMessage;
  expanded: boolean;
  busy: boolean;
  onView: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <tr>
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
            <button
              className={styles.tableActionBtn}
              type="button"
              onClick={onView}
              aria-expanded={expanded}
            >
              {expanded ? "Hide" : "View"}
            </button>
            <button
              className={`${styles.tableActionBtn} ${styles.danger}`}
              type="button"
              onClick={onDelete}
              disabled={busy}
              aria-busy={busy}
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td className={styles.td} colSpan={5}>
            <div
              style={{
                whiteSpace: "pre-wrap",
                padding: "0.5rem 0",
                color: "var(--color-text, inherit)",
              }}
            >
              <a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`}>
                Reply to {m.email}
              </a>
              <p style={{ marginTop: "0.75rem" }}>{m.message}</p>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
