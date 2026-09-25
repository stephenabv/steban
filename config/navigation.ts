export interface NavLink {
  href: string;
  label: string;
}

/** Primary public navigation (PLAN.md §8.1). "Get in Touch" renders as the navbar CTA. */
export const primaryNav: readonly NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
];

export const contactNav: NavLink = { href: "/contact", label: "Get in Touch" };

export const legalNav: readonly NavLink[] = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
];

/** Section match: "/" is exact, everything else also matches nested routes. */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
