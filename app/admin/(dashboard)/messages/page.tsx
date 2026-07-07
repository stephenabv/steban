import type { Metadata } from "next";
import { getContactService } from "@/server/services";
import { MessagesInbox } from "@/features/admin/MessagesInbox";
import type { InboxMessage } from "@/features/admin/MessagesInbox";
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

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Messages</h1>
        <p className={styles.subtitle}>Contact form submissions from visitors.</p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Inbox</h2>
        {!result.ok && (
          <p className={styles.errorBanner} role="alert">
            Could not load messages. Please refresh.
          </p>
        )}
        <MessagesInbox messages={messages} />
      </div>
    </div>
  );
}
