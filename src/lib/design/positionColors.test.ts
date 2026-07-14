import { describe, expect, it } from "vitest";
import { getPositionColorClasses } from "@/lib/design/positionColors";

describe("getPositionColorClasses", () => {
  it("gives each core position a distinct color", () => {
    const positions = ["QB", "RB", "WR", "TE", "K", "DEF"];
    const colorSets = positions.map((position) => getPositionColorClasses(position));

    const uniqueTextColors = new Set(colorSets.map((colors) => colors.text));
    expect(uniqueTextColors.size).toBe(positions.length);
  });

  it("falls back to a neutral color for an unknown or null position", () => {
    const unknown = getPositionColorClasses("LS");
    const nullPosition = getPositionColorClasses(null);

    expect(unknown).toEqual(nullPosition);
  });
});
