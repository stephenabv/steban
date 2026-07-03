import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/features/admin/AdminSidebar";
import { getSession } from "@/server/auth/session";
import { getAdminBasePath } from "@/lib/adminRoute";
import styles from "./admin.module.less";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const basePath = getAdminBasePath();

  // Proxy already redirects unauthenticated requests before they reach this layout;
  // this check is a second line of defense so dashboard content never renders without a valid session.
  const session = await getSession();
  if (!session.isAdmin) {
    redirect(`${basePath}/login`);
  }

  return (
    <div className={styles.layout}>
      <AdminSidebar basePath={basePath} />
      <main className={styles.main} id="main-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
