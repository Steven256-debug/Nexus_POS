/**
 * Production-ready rate limiter for login attempts.
 * Uses LRU-style Map with automatic expiry — no setInterval, no memory leak.
 * Keys by identifier (email or IP) with configurable limits.
 */

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ENTRIES = 10000; // LRU cap to prevent unbounded growth

interface AttemptRecord {
  count: number;
  firstAttempt: number;
}

const attempts = new Map<string, AttemptRecord>();

/**
 * Evicts expired entries and enforces the LRU cap.
 * Called lazily on each check — no background interval needed.
 */
function evictStale(): void {
  const now = Date.now();

  // Evict expired entries
  for (const [key, record] of Array.from(attempts.entries())) {
    if (now - record.firstAttempt > WINDOW_MS) {
      attempts.delete(key);
    }
  }

  // If still over capacity, evict oldest entries (Map preserves insertion order)
  if (attempts.size > MAX_ENTRIES) {
    const excess = attempts.size - MAX_ENTRIES;
    let removed = 0;
    for (const key of Array.from(attempts.keys())) {
      if (removed >= excess) break;
      attempts.delete(key);
      removed++;
    }
  }
}

/**
 * Check if the given identifier is rate-limited.
 * @param identifier — email address, IP, or combined key
 */
export function checkRateLimit(identifier: string): { allowed: boolean; retryAfterSeconds?: number } {
  evictStale();

  const now = Date.now();
  const record = attempts.get(identifier);

  if (!record) {
    attempts.set(identifier, { count: 1, firstAttempt: now });
    return { allowed: true };
  }

  // If the window has expired, reset
  if (now - record.firstAttempt > WINDOW_MS) {
    attempts.set(identifier, { count: 1, firstAttempt: now });
    return { allowed: true };
  }

  // Within window — check count
  if (record.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((WINDOW_MS - (now - record.firstAttempt)) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  // Increment
  record.count++;
  return { allowed: true };
}

/**
 * Reset rate limit for an identifier (called on successful login).
 */
export function resetRateLimit(identifier: string): void {
  attempts.delete(identifier);
}

/**
 * Get current attempt count for testing purposes.
 */
export function _getAttemptCount(identifier: string): number {
  return attempts.get(identifier)?.count ?? 0;
}

/**
 * Clear all rate limit state (for testing).
 */
export function _clearAll(): void {
  attempts.clear();
}
