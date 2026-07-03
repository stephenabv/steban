import type { Metadata } from "next";
import Link from "next/link";
import styles from "./admin.module.less";
import pageStyles from "@/features/admin/AdminPage.module.less";

export const metadata: Metadata = { title: "Dashboard" };

const QUICK_LINKS = [
  { href: "/admin/hero", title: "Hero", desc: "Edit name, title, photo, and intro" },
  { href: "/admin/about", title: "About", desc: "Biography, skills, experience" },
  { href: "/admin/projects", title: "Projects", desc: "Add and manage projects" },
  { href: "/admin/featured", title: "Featured", desc: "Choose featured project carousel" },
  { href: "/admin/seo", title: "SEO", desc: "Page metadata, OG, structured data" },
  { href: "/admin/messages", title: "Messages", desc: "View contact form submissions" },
];

export default function AdminDashboardPage() {
  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.header}>
        <h1 className={pageStyles.title}>Dashboard</h1>
        <p className={pageStyles.subtitle}>Welcome back. Manage your portfolio content below.</p>
      </div>

      <div className={pageStyles.statsGrid}>
        <div className={pageStyles.statCard}>
          <p className={pageStyles.statValue}>0</p>
          <p className={pageStyles.statLabel}>Projects</p>
        </div>
        <div className={pageStyles.statCard}>
          <p className={pageStyles.statValue}>0</p>
          <p className={pageStyles.statLabel}>Featured</p>
        </div>
        <div className={pageStyles.statCard}>
          <p className={pageStyles.statValue}>0</p>
          <p className={pageStyles.statLabel}>Messages</p>
        </div>
        <div className={pageStyles.statCard}>
          <p className={pageStyles.statValue}>0</p>
          <p className={pageStyles.statLabel}>Unread</p>
        </div>
      </div>

      <div style={{ marginTop: "2.5rem" }}>
        <h2 className={pageStyles.cardTitle} style={{ marginBottom: "1rem" }}>
          Quick Access
        </h2>
        <ul className={pageStyles.quickLinks} role="list">
          {QUICK_LINKS.map(({ href, title, desc }) => (
            <li key={href}>
              <Link href={href} className={pageStyles.quickLink}>
                <div>
                  <p className={pageStyles.quickLinkTitle}>{title}</p>
                  <p className={pageStyles.quickLinkDesc}>{desc}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ marginLeft: "auto" }}>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
