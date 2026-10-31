/** Above this many tracked clients, idle entries are swept to bound memory. */
const SWEEP_THRESHOLD = 5_000;
const MS_PER_SECOND = 1_000;

/** Outcome of a rate-limit check. */
export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * In-memory sliding-window limiter. State is per server instance, so on serverless hosts each
 * warm instance counts separately; a shared store such as Redis is the scale-out path.
 */
export class SlidingWindowRateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  /**
   * Records a request for `key` if it is within the limit.
   * @param key - client identifier, usually an IP address.
   */
  check(key: string): RateLimitDecision {
    const now = this.now();
    const windowStart = now - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((time) => time > windowStart);

    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      const oldest = recent[0] ?? now;
      const retryAfterSeconds = Math.max(1, Math.ceil((oldest + this.windowMs - now) / MS_PER_SECOND));
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > SWEEP_THRESHOLD) this.sweep(windowStart);
    return { allowed: true, remaining: this.limit - recent.length, retryAfterSeconds: 0 };
  }

  /** Number of clients currently tracked; exposed for tests. */
  get size(): number {
    return this.hits.size;
  }

  private sweep(windowStart: number): void {
    for (const [key, times] of this.hits) {
      if (times.every((time) => time <= windowStart)) this.hits.delete(key);
    }
  }
}

/** Plan generation: 8 requests per minute per client keeps Gemini spend predictable. */
export const planRateLimiter = new SlidingWindowRateLimiter(8, 60_000);
/** Assistant chat: 15 messages per minute per client. */
export const chatRateLimiter = new SlidingWindowRateLimiter(15, 60_000);

/**
 * Picks a client identifier. Platform-set headers are preferred because a client cannot
 * forge them; the first X-Forwarded-For entry is client-controlled and only a fallback.
 * @param headers - incoming request headers.
 */
export function clientKey(headers: Headers): string {
  const candidates = [
    headers.get("x-vercel-forwarded-for")?.split(",")[0],
    headers.get("x-real-ip"),
    headers.get("x-forwarded-for")?.split(",")[0],
  ];
  return candidates.map((value) => value?.trim()).find(Boolean) ?? "anonymous";
}
