import type { Metadata } from "next";
import { getContactService } from "@/server/services";
import { MessagesInbox } from "@/features/admin/MessagesInbox";
import type { InboxMessage } from "@/features/admin/MessagesInbox";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { Alert } from "@/components/ui/Alert";
import styles from "@/features/admin/AdminPage.module.less";

export const metadata: Metadata = { title: "Messages" };

// Always read fresh — this inbox reflects live submissions.
export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const result = await getContactService().getMessages({ page: 1, pageSize: 100 });

  const messages: InboxMessage[] = result.ok
    ? result.value.items.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        subject: m.subject,
        message: m.message,
        createdAt: m.createdAt.toISOString(),
        read: m.read,
      }))
    : [];
  const unread = messages.filter((m) => !m.read).length;

  return (
    <div className={styles.page}>
      <AdminPageHeader
        title="Messages"
        description={
          result.ok
            ? `Contact form submissions from visitors${unread > 0 ? ` · ${unread} unread` : ""}.`
            : "Contact form submissions from visitors."
        }
      />

      {result.ok ? (
        <MessagesInbox messages={messages} />
      ) : (
        <Alert tone="danger" title="Could not load messages">
          Please refresh the page. If this keeps happening, check the database connection.
        </Alert>
      )}
    </div>
  );
}
