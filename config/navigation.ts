import type { IconName } from "@/components/icons/Icon";

export interface NavLink {
  href: string;
  label: string;
}

/** A navigation entry that also renders as an icon tab (navbar, phone tab bar). */
export interface NavTab extends NavLink {
  icon: IconName;
}

/** Primary public navigation (PLAN.md §8.1). "Get in Touch" renders as the navbar CTA. */
export const primaryNav: readonly NavTab[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/projects", label: "Projects", icon: "grid" },
  { href: "/about", label: "About", icon: "user" },
];

export const contactNav: NavTab = { href: "/contact", label: "Get in Touch", icon: "mail" };

/** Phone bottom tab bar: every primary section plus Contact, with a short label. */
export const tabBarNav: readonly NavTab[] = [...primaryNav, { ...contactNav, label: "Contact" }];

export const legalNav: readonly NavLink[] = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
];

/** Section match: "/" is exact, everything else also matches nested routes. */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
