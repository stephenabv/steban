"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markMessageReadAction, deleteMessageAction } from "./messageActions";
import { Modal, ModalFooterStart } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/ToastProvider";
import { DataTable } from "@/components/data/DataTable";
import type { DataColumn } from "@/components/data/DataTable";
import { DataToolbar } from "@/components/data/DataToolbar";
import { Pagination } from "@/components/data/Pagination";
import { ListQuery, compareBy } from "@/lib/list/ListQuery";
import { useListQuery } from "@/lib/list/useListQuery";
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

const inboxQuery = new ListQuery<InboxMessage>({
  searchText: (m) => [m.name, m.email, m.subject, m.message],
  filters: [
    { id: "unread", label: "Unread", predicate: (m) => !m.read },
    { id: "read", label: "Read", predicate: (m) => m.read },
  ],
  sorts: [
    {
      id: "received",
      compare: compareBy.date((m) => m.createdAt),
      labels: { desc: "Newest first", asc: "Oldest first" },
    },
    {
      id: "sender",
      compare: compareBy.text((m) => m.name),
      labels: { asc: "Sender A–Z", desc: "Sender Z–A" },
    },
  ],
});

const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const longDate = new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "short" });

export function MessagesInbox({ messages }: { messages: InboxMessage[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [viewMessage, setViewMessage] = useState<InboxMessage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InboxMessage | null>(null);
  const list = useListQuery(messages, inboxQuery, {
    sort: { id: "received", direction: "desc" },
    pageSize: 15,
  });

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

  const columns: DataColumn<InboxMessage>[] = [
    {
      id: "from",
      header: "From",
      sortId: "sender",
      mobile: "primary",
      cell: (m) => (
        <div className={styles.cellPrimary}>
          <span className={m.read ? styles.readDot : styles.unreadDot} aria-hidden="true" />
          <span className={styles.cellText}>
            <span className={styles.cellTitle}>{m.name}</span>
            <span className={styles.cellSub}>{m.email}</span>
          </span>
        </div>
      ),
    },
    {
      id: "subject",
      header: "Subject",
      cell: (m) => (
        <span className={styles.cellText}>
          <span className={styles.cellTitle}>{m.subject}</span>
          <span className={styles.cellSub}>{m.message}</span>
        </span>
      ),
    },
    {
      id: "received",
      header: "Received",
      sortId: "received",
      sortInitial: "desc",
      cell: (m) => <time dateTime={m.createdAt}>{shortDate.format(new Date(m.createdAt))}</time>,
    },
    {
      id: "status",
      header: "Status",
      cell: (m) =>
        m.read ? (
          <Badge>Read</Badge>
        ) : (
          <Badge tone="accent" dot>
            Unread
          </Badge>
        ),
    },
    {
      id: "actions",
      header: "Actions",
      hideHeader: true,
      align: "end",
      mobile: "actions",
      cell: (m) => (
        <div className={styles.rowActions}>
          <Button
            variant="secondary"
            size="sm"
            icon="mail-open"
            onClick={() => onView(m)}
            aria-label={`Open message from ${m.name}`}
          >
            Open
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon="trash"
            iconOnly
            onClick={() => setDeleteTarget(m)}
            disabled={pending}
            aria-label={`Delete message from ${m.name}`}
            title="Delete"
          />
        </div>
      ),
    },
  ];

  if (messages.length === 0) {
    return (
      <EmptyState
        icon="inbox"
        title="No messages yet"
        description="When someone submits the contact form, their message will appear here."
      />
    );
  }

  return (
    <>
      <DataToolbar
        searchLabel="Search messages"
        searchPlaceholder="Search name, email, subject or message…"
        search={list.state.search}
        onSearch={list.setSearch}
        filters={inboxQuery.filters}
        filterId={list.state.filterId}
        filterCounts={list.result.filterCounts}
        onFilter={list.setFilter}
        sorts={inboxQuery.sorts}
        sort={list.state.sort}
        onSort={list.setSort}
      />
      <DataTable
        caption="Contact messages"
        columns={columns}
        rows={list.result.items}
        getRowKey={(m) => m.id}
        sort={list.state.sort}
        onSort={list.toggleSort}
        rowClassName={(m) => (m.read ? undefined : styles.unreadRow)}
        empty={
          <EmptyState
            compact
            icon="search"
            title={
              list.state.filterId === "unread" && !list.state.search
                ? "You're all caught up"
                : "No messages match"
            }
            description={
              list.state.filterId === "unread" && !list.state.search
                ? "There are no unread messages."
                : "Try a different search or filter."
            }
            action={
              <Button variant="secondary" size="sm" icon="refresh" onClick={list.reset}>
                Show all messages
              </Button>
            }
          />
        }
      />
      <Pagination
        page={list.result.page}
        totalPages={list.result.totalPages}
        rangeStart={list.result.rangeStart}
        rangeEnd={list.result.rangeEnd}
        total={list.result.total}
        noun="messages"
        onPageChange={list.setPage}
      />

      <Modal
        open={viewMessage !== null}
        onClose={() => setViewMessage(null)}
        title={viewMessage?.subject ?? ""}
        size="lg"
        footer={
          viewMessage && (
            <>
              <ModalFooterStart>
                <Button variant="danger" icon="trash" onClick={() => setDeleteTarget(viewMessage)}>
                  Delete
                </Button>
              </ModalFooterStart>
              <Button variant="secondary" onClick={() => setViewMessage(null)}>
                Close
              </Button>
              <Button
                href={`mailto:${viewMessage.email}?subject=${encodeURIComponent(`Re: ${viewMessage.subject}`)}`}
                icon="mail"
              >
                Reply by email
              </Button>
            </>
          )
        }
      >
        {viewMessage && (
          <>
            <dl className={styles.messageMeta}>
              <div>
                <dt>From</dt>
                <dd>
                  {viewMessage.name} &lt;{viewMessage.email}&gt;
                </dd>
              </div>
              <div>
                <dt>Received</dt>
                <dd>{longDate.format(new Date(viewMessage.createdAt))}</dd>
              </div>
            </dl>
            <p className={styles.messageBody}>{viewMessage.message}</p>
          </>
        )}
      </Modal>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete message?"
        message={
          deleteTarget ? (
            <>
              The message from <strong>{deleteTarget.name}</strong> will be permanently deleted.
              This cannot be undone.
            </>
          ) : (
            ""
          )
        }
        confirmLabel="Delete message"
        danger
        busy={pending}
        onConfirm={onConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
