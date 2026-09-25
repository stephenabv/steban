/**
 * Runs an idempotent setup step (e.g. CREATE TABLE IF NOT EXISTS) at most once
 * per instance *once it succeeds*. A failure is not cached: a plain
 * `promise ??= setup()` would keep replaying the first rejection (e.g. the
 * database was briefly unreachable at cold start) for the instance's lifetime.
 */
export function ensureOnce(setup: () => Promise<unknown>): () => Promise<void> {
  let pending: Promise<void> | null = null;
  return () => {
    pending ??= setup().then(
      () => undefined,
      (error: unknown) => {
        pending = null;
        throw error;
      }
    );
    return pending;
  };
}
