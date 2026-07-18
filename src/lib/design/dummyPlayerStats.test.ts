import { describe, expect, it } from "vitest";
import { getDummyByeWeek, getDummyValueScore } from "@/lib/design/dummyPlayerStats";

describe("getDummyByeWeek", () => {
  it("is deterministic for the same canonical player ID", () => {
    expect(getDummyByeWeek("4137")).toBe(getDummyByeWeek("4137"));
  });

  it("returns a plausible NFL bye week (4-14)", () => {
    for (const id of ["1", "2", "100", "4137", "999999"]) {
      const byeWeek = getDummyByeWeek(id);
      expect(byeWeek).toBeGreaterThanOrEqual(4);
      expect(byeWeek).toBeLessThanOrEqual(14);
    }
  });

  it("varies across different player IDs", () => {
    const byeWeeks = new Set(["1", "2", "3", "4", "5", "6", "7"].map(getDummyByeWeek));
    expect(byeWeeks.size).toBeGreaterThan(1);
  });
});

describe("getDummyValueScore", () => {
  it("is deterministic for the same canonical player ID", () => {
    expect(getDummyValueScore("4137")).toBe(getDummyValueScore("4137"));
  });

  it("returns a score between 0 and 100", () => {
    for (const id of ["1", "2", "100", "4137", "999999"]) {
      const score = getDummyValueScore(id);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });
});
