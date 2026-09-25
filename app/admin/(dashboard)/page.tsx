import type { Metadata } from "next";
import Link from "next/link";
import { getContactService, getProjectService } from "@/server/services";
import { getAdminBasePath } from "@/lib/adminRoute";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { StatCard } from "@/features/admin/StatCard";
import { adminNavigation } from "@/features/admin/adminNavigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/icons/Icon";
import styles from "@/features/admin/AdminPage.module.less";

export const metadata: Metadata = { title: "Dashboard" };

// Counts reflect live data.
export const dynamic = "force-dynamic";

const RECENT_LIMIT = 5;
/** Rows fetched to build the "recent" lists (the counts do not depend on this). */
const RECENT_SOURCE_SIZE = 100;
/** Unavailable figures render as an em dash rather than a misleading 0. */
const display = (value: number | null) => (value === null ? "—" : value);
const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export default async function AdminDashboardPage() {
  const basePath = getAdminBasePath();
  const projectService = getProjectService();
  const contactService = getContactService();
  // Every card reads an exact figure from the data layer — totals come from
  // COUNT(*) queries, never from the length of a paginated page.
  const [projectsResult, featuredResult, messagesResult, unreadResult] = await Promise.all([
    projectService.getAll({ pageSize: RECENT_SOURCE_SIZE }),
    projectService.getFeatured(),
    contactService.getMessages({ page: 1, pageSize: RECENT_SOURCE_SIZE }),
    contactService.getUnreadCount(),
  ]);

  const projects = projectsResult.ok ? projectsResult.value.items : [];
  const messages = messagesResult.ok ? messagesResult.value.items : [];
  const projectTotal = projectsResult.ok ? projectsResult.value.total : null;
  const featuredCount = featuredResult.ok ? featuredResult.value.length : null;
  const messageTotal = messagesResult.ok ? messagesResult.value.total : null;
  const unreadCount = unreadResult.ok ? unreadResult.value : null;
  const failed = [projectsResult, featuredResult, messagesResult, unreadResult].some((r) => !r.ok);

  const recentMessages = [...messages]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, RECENT_LIMIT);
  const recentProjects = [...projects]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, RECENT_LIMIT);

  const contentLinks = adminNavigation.flatMap((g) => g.items).filter((i) => i.path !== "" && i.path !== "/messages");

  return (
    <div className={styles.page}>
      <AdminPageHeader
        title="Dashboard"
        description="Welcome back. Here's what's happening with your portfolio."
        actions={
          <>
            <Button href={`${basePath}/messages`} variant="secondary" icon="inbox">
              Inbox{unreadCount ? ` (${unreadCount})` : ""}
            </Button>
            <Button href={`${basePath}/projects/new`} icon="plus">
              New project
            </Button>
          </>
        }
      />

      {failed && (
        <Alert tone="danger" title="Some data couldn't be loaded">
          Figures that couldn&apos;t be read are shown as &ldquo;—&rdquo;. Refresh to try again.
        </Alert>
      )}

      <section className={styles.statsGrid} aria-label="Summary">
        <StatCard label="Projects" value={display(projectTotal)} icon="layers" href={`${basePath}/projects`} />
        <StatCard
          label="Featured"
          value={display(featuredCount)}
          icon="star"
          tone="accent"
          href={`${basePath}/featured`}
          hint="Shown in the home carousel"
        />
        <StatCard label="Messages" value={display(messageTotal)} icon="message" href={`${basePath}/messages`} />
        <StatCard
          label="Unread"
          value={display(unreadCount)}
          icon="mail"
          tone={unreadCount ? "warning" : "default"}
          href={`${basePath}/messages`}
          hint={unreadCount === null ? undefined : unreadCount > 0 ? "Awaiting your reply" : "You're all caught up"}
        />
      </section>

      <div className={styles.twoCol}>
        <Card>
          <CardHeader
            title="Recent messages"
            actions={
              <Button href={`${basePath}/messages`} variant="link" size="sm" iconRight="arrow-right">
                View all
              </Button>
            }
          />
          {recentMessages.length === 0 ? (
            <EmptyState compact icon="inbox" title="No messages yet" description="Contact form submissions appear here." />
          ) : (
            <ul className={styles.list} role="list">
              {recentMessages.map((m) => (
                <li key={m.id} className={styles.listItem}>
                  <span className={m.read ? styles.readDot : styles.unreadDot} aria-hidden="true" />
                  <div className={styles.listMain}>
                    <span className={styles.listTitle}>
                      {m.subject}
                      {!m.read && <span className="sr-only"> (unread)</span>}
                    </span>
                    <span className={styles.listMeta}>
                      {m.name} · {dateFormatter.format(m.createdAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recently updated projects"
            actions={
              <Button href={`${basePath}/projects`} variant="link" size="sm" iconRight="arrow-right">
                Manage
              </Button>
            }
          />
          {recentProjects.length === 0 ? (
            <EmptyState
              compact
              icon="layers"
              title="No projects yet"
              description="Add your first project to populate the portfolio."
              action={
                <Button href={`${basePath}/projects/new`} size="sm" icon="plus">
                  New project
                </Button>
              }
            />
          ) : (
            <ul className={styles.list} role="list">
              {recentProjects.map((p) => (
                <li key={p.id} className={styles.listItem}>
                  <div className={styles.listMain}>
                    <span className={styles.listTitle}>{p.title}</span>
                    <span className={styles.listMeta}>Updated {dateFormatter.format(p.updatedAt)}</span>
                  </div>
                  {p.featured && <Badge tone="accent">Featured</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Manage content" description="Jump straight to any section of the site." />
        <ul className={styles.quickLinks} role="list">
          {contentLinks.map((item) => (
            <li key={item.path}>
              <Link href={`${basePath}${item.path}`} className={styles.quickLink}>
                <span className={styles.quickIcon} aria-hidden="true">
                  <Icon name={item.icon} size={18} />
                </span>
                <span>
                  <span className={styles.quickTitle}>{item.label}</span>
                  <br />
                  <span className={styles.quickDesc}>{item.description}</span>
                </span>
                <Icon name="arrow-right" size={16} />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
