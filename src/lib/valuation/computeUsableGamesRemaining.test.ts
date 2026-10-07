import { describe, expect, it } from "vitest";
import { computeUsableGamesRemaining } from "@/lib/valuation/computeUsableGamesRemaining";

describe("computeUsableGamesRemaining", () => {
  it("counts every remaining week as a usable game when the bye week hasn't happened yet", () => {
    // 18 regular-season weeks, currently week 1, bye in week 9 (still ahead) — 17 usable games
    // (18 remaining weeks minus the 1 bye week still to come).
    const usableGames = computeUsableGamesRemaining({ currentWeek: 1, byeWeek: 9 });

    expect(usableGames).toBe(17);
  });

  it("does not deduct anything further once the bye week has already passed", () => {
    // Week 10, bye was week 9 (already passed) — 9 remaining weeks (10 through 18), all usable.
    const usableGames = computeUsableGamesRemaining({ currentWeek: 10, byeWeek: 9 });

    expect(usableGames).toBe(9);
  });

  it("treats the current week itself as the bye if they match, not a usable game", () => {
    const usableGames = computeUsableGamesRemaining({ currentWeek: 9, byeWeek: 9 });

    // 10 remaining weeks (9 through 18) minus this week's bye = 9.
    expect(usableGames).toBe(9);
  });

  it("never returns more than the total number of regular-season games", () => {
    const usableGames = computeUsableGamesRemaining({ currentWeek: 1, byeWeek: 18 });

    expect(usableGames).toBeLessThanOrEqual(17);
  });

  it("never returns a negative number once the season is over", () => {
    const usableGames = computeUsableGamesRemaining({ currentWeek: 25, byeWeek: 9 });

    expect(usableGames).toBe(0);
  });

  it("handles a null bye week (unknown) as never subtracting a bye", () => {
    const usableGames = computeUsableGamesRemaining({ currentWeek: 10, byeWeek: null });

    expect(usableGames).toBe(9);
  });
});
