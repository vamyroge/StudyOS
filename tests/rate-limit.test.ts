import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit } from "@/lib/security/rate-limit";

describe("Rate Limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows requests within limit", () => {
    const key = `test-${Date.now()}-${Math.random()}`;
    const result1 = checkRateLimit(key, 3, 60_000);
    const result2 = checkRateLimit(key, 3, 60_000);
    const result3 = checkRateLimit(key, 3, 60_000);

    expect(result1.allowed).toBe(true);
    expect(result2.allowed).toBe(true);
    expect(result3.allowed).toBe(true);
  });

  it("blocks requests exceeding limit", () => {
    const key = `test-${Date.now()}-${Math.random()}`;
    checkRateLimit(key, 2, 60_000);
    checkRateLimit(key, 2, 60_000);
    const result = checkRateLimit(key, 2, 60_000);

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets after window expires", () => {
    const key = `test-${Date.now()}-${Math.random()}`;
    checkRateLimit(key, 1, 100); // 100ms window
    
    // Wait for window to expire
    return new Promise((resolve) => {
      setTimeout(() => {
        const result = checkRateLimit(key, 1, 100);
        expect(result.allowed).toBe(true);
        resolve(undefined);
      }, 150);
    });
  });

  it("isolates different keys", () => {
    const key1 = `test-${Date.now()}-${Math.random()}`;
    const key2 = `test-${Date.now()}-${Math.random()}`;

    checkRateLimit(key1, 1, 60_000);
    const result1 = checkRateLimit(key1, 1, 60_000);
    const result2 = checkRateLimit(key2, 1, 60_000);

    expect(result1.allowed).toBe(false);
    expect(result2.allowed).toBe(true);
  });
});
