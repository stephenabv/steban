/** Up to three upper-case initials, e.g. "Ada King Lovelace" → "AKL". */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}
