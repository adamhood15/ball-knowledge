import { describe, expect, it } from "vitest";
import { deriveHeuristicVariance } from "@/lib/projections/heuristicVariance";

describe("deriveHeuristicVariance", () => {
  it("returns a value in [0, 1]", () => {
    for (const position of ["QB", "RB", "WR", "TE", "K"]) {
      for (const injuryRisk of ["HEALTHY", "QUESTIONABLE", "OUT"] as const) {
        const variance = deriveHeuristicVariance({ position, injuryRisk });
        expect(variance).toBeGreaterThanOrEqual(0);
        expect(variance).toBeLessThanOrEqual(1);
      }
    }
  });

  it("gives RB a wider band than QB at the same (healthy) injury risk, reflecting committee/injury churn", () => {
    const qbVariance = deriveHeuristicVariance({ position: "QB", injuryRisk: "HEALTHY" });
    const rbVariance = deriveHeuristicVariance({ position: "RB", injuryRisk: "HEALTHY" });

    expect(rbVariance).toBeGreaterThan(qbVariance);
  });

  it("increases variance as injury risk rises, for the same position", () => {
    const healthy = deriveHeuristicVariance({ position: "WR", injuryRisk: "HEALTHY" });
    const questionable = deriveHeuristicVariance({ position: "WR", injuryRisk: "QUESTIONABLE" });
    const out = deriveHeuristicVariance({ position: "WR", injuryRisk: "OUT" });

    expect(questionable).toBeGreaterThan(healthy);
    expect(out).toBeGreaterThan(questionable);
  });

  it("falls back to a default band for an unrecognized position", () => {
    expect(() => deriveHeuristicVariance({ position: "LS", injuryRisk: "HEALTHY" })).not.toThrow();
  });

  it("gives a defense zero variance regardless of injury risk — a team unit isn't individually injury-prone", () => {
    for (const injuryRisk of ["HEALTHY", "QUESTIONABLE", "OUT"] as const) {
      expect(deriveHeuristicVariance({ position: "DEF", injuryRisk })).toBe(0);
    }
  });
});
