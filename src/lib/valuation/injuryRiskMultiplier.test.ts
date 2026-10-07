import { describe, expect, it } from "vitest";
import { injuryRiskMultiplier } from "@/lib/valuation/injuryRiskMultiplier";

describe("injuryRiskMultiplier", () => {
  it("applies no discount for a healthy player", () => {
    expect(injuryRiskMultiplier("HEALTHY")).toBe(1);
  });

  it("applies a small discount for a questionable player", () => {
    const multiplier = injuryRiskMultiplier("QUESTIONABLE");

    expect(multiplier).toBeLessThan(1);
    expect(multiplier).toBeGreaterThan(0.5);
  });

  it("applies a larger discount for a player who is out than one who is merely questionable", () => {
    const questionable = injuryRiskMultiplier("QUESTIONABLE");
    const out = injuryRiskMultiplier("OUT");

    expect(out).toBeLessThan(questionable);
  });

  it("never returns a negative multiplier", () => {
    expect(injuryRiskMultiplier("OUT")).toBeGreaterThanOrEqual(0);
  });
});
