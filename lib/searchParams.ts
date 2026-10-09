export type SearchParamValue = string | string[] | undefined;

/** First value of a query parameter, length-capped so it is safe to echo into a UI filter. */
export function firstSearchParam(value: SearchParamValue, maxLength = 80): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim().slice(0, maxLength);
  return trimmed || undefined;
}
