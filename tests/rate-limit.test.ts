import { describe, expect, it, beforeEach } from "vitest";
import { _resetRateLimitForTests, rateLimit } from "@/lib/rate-limit";

describe("rate limiter", () => {
  beforeEach(() => _resetRateLimitForTests());

  it("allows requests under the limit", () => {
    const a = rateLimit("t1", 2, 60_000, 1000);
    const b = rateLimit("t1", 2, 60_000, 1001);
    expect(a.allowed).toBe(true);
    expect(b.allowed).toBe(true);
    expect(b.remaining).toBe(0);
  });

  it("blocks when limit exceeded", () => {
    rateLimit("t2", 1, 60_000, 1000);
    const blocked = rateLimit("t2", 1, 60_000, 1001);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("resets after window", () => {
    rateLimit("t3", 1, 1000, 1000);
    const blocked = rateLimit("t3", 1, 1000, 1500);
    expect(blocked.allowed).toBe(false);
    const after = rateLimit("t3", 1, 1000, 2100);
    expect(after.allowed).toBe(true);
  });
});
