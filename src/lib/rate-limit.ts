/**
 * Simple in-memory rate limiter for login attempts.
 * Limits to MAX_ATTEMPTS per windowMs per IP address.
 */

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000; // 1 minute

interface AttemptRecord {
  count: number;
  firstAttempt: number;
}

const attempts = new Map<string, AttemptRecord>();

// Clean up old entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of attempts) {
    if (now - record.firstAttempt > WINDOW_MS) {
      attempts.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record) {
    attempts.set(ip, { count: 1, firstAttempt: now });
    return { allowed: true };
  }

  // If the window has expired, reset
  if (now - record.firstAttempt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAttempt: now });
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

export function resetRateLimit(ip: string): void {
  attempts.delete(ip);
}
