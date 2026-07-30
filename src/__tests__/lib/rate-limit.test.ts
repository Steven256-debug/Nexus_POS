import { checkRateLimit, resetRateLimit, _clearAll, _getAttemptCount } from '@/lib/rate-limit';

describe('Rate Limiter', () => {
  beforeEach(() => {
    _clearAll();
  });

  test('allows first attempt', () => {
    const result = checkRateLimit('user@test.com');
    expect(result.allowed).toBe(true);
  });

  test('allows up to 10 attempts', () => {
    for (let i = 0; i < 10; i++) {
      const result = checkRateLimit('user@test.com');
      expect(result.allowed).toBe(true);
    }
  });

  test('blocks after 10 attempts', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit('user@test.com');
    }
    const result = checkRateLimit('user@test.com');
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  test('tracks different identifiers independently', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit('user1@test.com');
    }
    // user1 is blocked
    expect(checkRateLimit('user1@test.com').allowed).toBe(false);
    // user2 is still allowed
    expect(checkRateLimit('user2@test.com').allowed).toBe(true);
  });

  test('resets limit for identifier', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit('user@test.com');
    }
    expect(checkRateLimit('user@test.com').allowed).toBe(false);

    resetRateLimit('user@test.com');
    expect(checkRateLimit('user@test.com').allowed).toBe(true);
  });

  test('tracks attempt count correctly', () => {
    expect(_getAttemptCount('user@test.com')).toBe(0);
    
    checkRateLimit('user@test.com');
    expect(_getAttemptCount('user@test.com')).toBe(1);
    
    checkRateLimit('user@test.com');
    expect(_getAttemptCount('user@test.com')).toBe(2);
  });

  test('retryAfterSeconds decreases over time', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit('user@test.com');
    }
    const result = checkRateLimit('user@test.com');
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(300); // 5 minutes max
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  test('clearAll resets all state', () => {
    checkRateLimit('user1@test.com');
    checkRateLimit('user2@test.com');
    
    _clearAll();
    
    expect(_getAttemptCount('user1@test.com')).toBe(0);
    expect(_getAttemptCount('user2@test.com')).toBe(0);
  });
});
