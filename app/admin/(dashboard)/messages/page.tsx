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

/** Rows loaded into the client-side table (search/filter/sort run in the browser). */
const PAGE_LIMIT = 100;

export default async function AdminMessagesPage() {
  const [result, unreadResult] = await Promise.all([
    getContactService().getMessages({ page: 1, pageSize: PAGE_LIMIT }),
    getContactService().getUnreadCount(),
  ]);

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
  // Exact figures from the database, independent of how many rows were loaded.
  const unread = unreadResult.ok ? unreadResult.value : null;
  const total = result.ok ? result.value.total : 0;

  return (
    <div className={styles.page}>
      <AdminPageHeader
        title="Messages"
        description={
          result.ok
            ? `${total} message${total === 1 ? "" : "s"} from visitors${unread ? ` · ${unread} unread` : ""}.`
            : "Contact form submissions from visitors."
        }
      />

      {result.ok && total > messages.length && (
        <Alert tone="info" title={`Showing ${messages.length} of ${total} messages`}>
          Unread messages are loaded first, then the newest. Delete handled messages to bring older ones into view.
        </Alert>
      )}

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
