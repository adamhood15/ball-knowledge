import { describe, expect, it } from "vitest";
import { getValueScoreColorClasses } from "@/lib/design/valueScoreColors";

describe("getValueScoreColorClasses", () => {
  it("returns green classes for a high score", () => {
    expect(getValueScoreColorClasses(85).text).toContain("green");
  });

  it("returns yellow classes for a medium score", () => {
    expect(getValueScoreColorClasses(55).text).toContain("yellow");
  });

  it("returns red classes for a low score", () => {
    expect(getValueScoreColorClasses(15).text).toContain("red");
  });

  it("treats the high/medium boundary (70) as high", () => {
    expect(getValueScoreColorClasses(70).text).toContain("green");
  });

  it("treats the medium/low boundary (40) as medium", () => {
    expect(getValueScoreColorClasses(40).text).toContain("yellow");
  });
});
