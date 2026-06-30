import type { Metadata } from "next";
import styles from "@/features/admin/AdminPage.module.less";

export const metadata: Metadata = { title: "Messages" };

// TODO: fetch from ContactService when DB is wired up
const messages: {
  id: string;
  name: string;
  email: string;
  subject: string;
  createdAt: Date;
  read: boolean;
}[] = [];

export default function AdminMessagesPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Messages</h1>
        <p className={styles.subtitle}>Contact form submissions from visitors.</p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Inbox</h2>

        {messages.length === 0 ? (
          <p style={{ color: "var(--color-text-muted, #606075)", textAlign: "center", padding: "3rem" }}>
            No messages yet.
          </p>
        ) : (
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
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted, #606075)" }}>{m.email}</div>
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
                      <button className={styles.tableActionBtn} type="button">View</button>
                      <button className={`${styles.tableActionBtn} ${styles.danger}`} type="button">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
