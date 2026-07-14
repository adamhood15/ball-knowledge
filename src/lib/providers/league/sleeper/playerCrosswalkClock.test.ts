import { describe, expect, it } from "vitest";
import { isPlayerCrosswalkStale } from "@/lib/providers/league/sleeper/playerCrosswalkClock";

describe("isPlayerCrosswalkStale", () => {
  it("is stale when never refreshed", () => {
    expect(isPlayerCrosswalkStale(null, new Date("2026-07-13T12:00:00Z"))).toBe(true);
  });

  it("is not stale when refreshed less than 24 hours ago", () => {
    const lastRefreshedAt = new Date("2026-07-13T00:00:00Z");
    const now = new Date("2026-07-13T23:59:00Z");
    expect(isPlayerCrosswalkStale(lastRefreshedAt, now)).toBe(false);
  });

  it("is stale once 24 hours have passed since the last refresh", () => {
    const lastRefreshedAt = new Date("2026-07-12T12:00:00Z");
    const now = new Date("2026-07-13T12:00:01Z");
    expect(isPlayerCrosswalkStale(lastRefreshedAt, now)).toBe(true);
  });
});
