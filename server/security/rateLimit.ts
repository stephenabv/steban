interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: options.max - 1, resetAt: now + options.windowMs };
  }

  entry.count += 1;
  const remaining = Math.max(0, options.max - entry.count);

  if (entry.count > options.max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining, resetAt: entry.resetAt };
}

// Preset policies
export const rateLimitPolicies = {
  contactForm: { windowMs: 60 * 60 * 1000, max: 5 },  // 5 per hour
  adminLogin: { windowMs: 15 * 60 * 1000, max: 10 },  // 10 per 15 min
  api: { windowMs: 60 * 1000, max: 60 },              // 60 per min
} as const;
