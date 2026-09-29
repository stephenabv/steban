type Listener = () => void;

export interface NavigationProgressSnapshot {
  /** Pathname the pending navigation started from; `null` when idle. */
  readonly pendingFrom: string | null;
  /** Mounted route-level loading fallbacks (loading.tsx) currently on screen. */
  readonly routeLoaders: number;
}

const IDLE: NavigationProgressSnapshot = Object.freeze({ pendingFrom: null, routeLoaders: 0 });

/**
 * Tracks client-side navigations from the moment of intent (the click) rather
 * than from when Next.js commits the next route's loading state, which can lag
 * a full server round-trip on an un-prefetched link.
 *
 * Two sources feed one overlay without ever stacking two of them:
 *  - `start()`   — a qualifying link click (see NavigationLoader);
 *  - `register()` — a loading.tsx fallback mounted and painting its own overlay.
 *
 * Immutable snapshots make it a drop-in `useSyncExternalStore` source.
 */
export class NavigationProgress {
  private snapshot: NavigationProgressSnapshot = IDLE;
  private readonly listeners = new Set<Listener>();

  start(fromPathname: string): void {
    this.update({ pendingFrom: fromPathname });
  }

  cancel(): void {
    if (this.snapshot.pendingFrom !== null) this.update({ pendingFrom: null });
  }

  /** Called by a route loading fallback on mount; returns its unregister. */
  register(): () => void {
    this.update({ routeLoaders: this.snapshot.routeLoaders + 1 });

    let registered = true;
    return () => {
      if (!registered) return;
      registered = false;
      this.update({ routeLoaders: Math.max(0, this.snapshot.routeLoaders - 1) });
    };
  }

  // ─── useSyncExternalStore adapter ──────────────────────────────────────────
  readonly subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  readonly getSnapshot = (): NavigationProgressSnapshot => this.snapshot;

  readonly getServerSnapshot = (): NavigationProgressSnapshot => IDLE;

  private update(patch: Partial<NavigationProgressSnapshot>): void {
    this.snapshot = Object.freeze({ ...this.snapshot, ...patch });
    for (const listener of this.listeners) listener();
  }
}

/** App-wide instance; mutated only from client event handlers and effects. */
export const navigationProgress = new NavigationProgress();
