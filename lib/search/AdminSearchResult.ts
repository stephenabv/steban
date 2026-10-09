/** Serializable admin search results, shared by the server action and the command palette. */

export const ADMIN_SEARCH_GROUPS = ["projects", "messages", "coverLetters", "legal"] as const;
export type AdminSearchGroupId = (typeof ADMIN_SEARCH_GROUPS)[number];

export interface AdminSearchHit {
  /** Unique within its group. */
  id: string;
  title: string;
  subtitle?: string;
  /** Short status label, e.g. "Unread" or "Draft". */
  badge?: string;
  /** Absolute admin URL (base path included). */
  href: string;
}

export interface AdminSearchGroup {
  id: AdminSearchGroupId;
  label: string;
  hits: AdminSearchHit[];
}

export type AdminSearchResponse =
  | {
      ok: true;
      query: string;
      groups: AdminSearchGroup[];
      /** Labels of groups that failed to load. */
      unavailable: string[];
    }
  | { ok: false; error: string };
