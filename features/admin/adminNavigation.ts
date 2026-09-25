import type { IconName } from "@/components/icons/Icon";

export interface AdminNavItem {
  /** Path relative to the admin base path ("" is the dashboard). */
  path: string;
  label: string;
  icon: IconName;
  description: string;
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

export const adminNavigation: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [
      { path: "", label: "Dashboard", icon: "grid", description: "Stats and recent activity" },
      { path: "/messages", label: "Messages", icon: "inbox", description: "Contact form submissions" },
    ],
  },
  {
    label: "Content",
    items: [
      { path: "/projects", label: "Projects", icon: "layers", description: "Add and manage projects" },
      { path: "/featured", label: "Featured", icon: "star", description: "Home page carousel" },
      { path: "/hero", label: "Hero", icon: "user", description: "Name, title, photo and intro" },
      { path: "/resume", label: "Resume", icon: "file-text", description: "Upload and replace your resume PDF" },
      { path: "/about", label: "About", icon: "briefcase", description: "Biography, skills, experience" },
      { path: "/contact-info", label: "Contact Info", icon: "mail", description: "Email and profile links" },
    ],
  },
  {
    label: "Site",
    items: [
      { path: "/seo", label: "SEO Metadata", icon: "search", description: "Titles, descriptions, OG images" },
      { path: "/social", label: "Social Links", icon: "share", description: "Footer and contact profiles" },
      { path: "/footer", label: "Footer", icon: "layout", description: "Legal links" },
      { path: "/analytics", label: "Analytics", icon: "bar-chart", description: "Tracking status" },
    ],
  },
];

export function isAdminPathActive(pathname: string, basePath: string, path: string): boolean {
  const href = `${basePath}${path}`;
  if (path === "") return pathname === basePath || pathname === `${basePath}/`;
  return pathname === href || pathname.startsWith(`${href}/`);
}
