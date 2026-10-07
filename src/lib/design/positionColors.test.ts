import { describe, expect, it } from "vitest";
import { getPositionColorClasses } from "@/lib/design/positionColors";

describe("getPositionColorClasses", () => {
  it("gives each core position a distinct color", () => {
    const positions = ["QB", "RB", "WR", "TE", "K", "DEF"];
    const colorSets = positions.map((position) => getPositionColorClasses(position));

    const uniqueTextColors = new Set(colorSets.map((colors) => colors.text));
    expect(uniqueTextColors.size).toBe(positions.length);
  });

  it("gives FLEX, SUPERFLEX, and BENCH their own distinct colors too, not the neutral fallback", () => {
    const slots = ["QB", "RB", "WR", "TE", "K", "DEF", "FLEX", "SUPERFLEX", "BENCH"];
    const colorSets = slots.map((slot) => getPositionColorClasses(slot));

    const uniqueTextColors = new Set(colorSets.map((colors) => colors.text));
    expect(uniqueTextColors.size).toBe(slots.length);
    for (const colors of colorSets.slice(6)) {
      expect(colors.text).not.toBe("text-muted-text");
    }
  });

  it("falls back to a neutral color for an unknown or null position", () => {
    const unknown = getPositionColorClasses("LS");
    const nullPosition = getPositionColorClasses(null);

    expect(unknown).toEqual(nullPosition);
  });

  it("gives each position a distinct hover-accent class for the square icon-button pattern", () => {
    const slots = ["QB", "RB", "WR", "TE", "K", "DEF", "FLEX", "SUPERFLEX", "BENCH"];
    const hoverAccents = slots.map((slot) => getPositionColorClasses(slot).hoverAccent);

    expect(new Set(hoverAccents).size).toBe(slots.length);
    for (const hoverAccent of hoverAccents) {
      expect(hoverAccent).toContain("hover:");
    }
  });

  it("gives each position a distinct hover-shadow class that doesn't fill the background, for player select cards", () => {
    const slots = ["QB", "RB", "WR", "TE", "K", "DEF", "FLEX", "SUPERFLEX", "BENCH"];
    const hoverShadows = slots.map((slot) => getPositionColorClasses(slot).hoverShadow);

    expect(new Set(hoverShadows).size).toBe(slots.length);
    for (const hoverShadow of hoverShadows) {
      expect(hoverShadow).toContain("hover:shadow-");
      expect(hoverShadow).not.toContain("hover:bg-");
    }
  });
});
