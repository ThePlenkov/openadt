/**
 * Throttling helper for LSP method calls.
 * Token bucket implementation to prevent server overload.
 */

class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillIntervalMs: number;

  constructor(capacity: number, refillIntervalMs: number) {
    this.capacity = capacity;
    this.refillIntervalMs = refillIntervalMs;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens > 0) {
      this.tokens--;
      return;
    }

    // Wait for next refill
    const now = Date.now();
    const timeSinceRefill = now - this.lastRefill;
    const waitTime = this.refillIntervalMs - timeSinceRefill;

    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.refill();
      this.tokens--;
    }
  }

  private refill(): void {
    const now = Date.now();
    const timeSinceRefill = now - this.lastRefill;

    if (timeSinceRefill >= this.refillIntervalMs) {
      const tokensToAdd = Math.floor(timeSinceRefill / this.refillIntervalMs);
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }
}

/**
 * Instance-based throttle for tool sets.
 * Each tool set can have its own throttle instance.
 */
export class AgentThrottle {
  private buckets = new Map<string, TokenBucket>();
  private readonly defaultRate: number;
  private readonly defaultPerMs: number;

  constructor(rate: number = 4, perMs: number = 1000) {
    this.defaultRate = rate;
    this.defaultPerMs = perMs;
  }

  /**
   * Acquire a token for the given destination.
   */
  async acquire(
    destination: string,
    options: { rate?: number; perMs?: number } = {},
  ): Promise<void> {
    const { rate = this.defaultRate, perMs = this.defaultPerMs } = options;
    const key = destination;

    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = new TokenBucket(rate, perMs);
      this.buckets.set(key, bucket);
    }

    await bucket.acquire();
  }

  /**
   * Clear all buckets (useful for tests or cleanup).
   */
  clear(): void {
    this.buckets.clear();
  }
}
