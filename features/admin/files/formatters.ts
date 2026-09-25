/** Upload timestamps in admin file cards, e.g. "September 25, 2026 at 3:04 PM". */
export const uploadedFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short" });
