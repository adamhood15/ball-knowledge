import { describe, expect, it } from "vitest";
import { normalizePlayerName } from "@/lib/trade/normalizePlayerName";

describe("normalizePlayerName", () => {
  it("lowercases the name", () => {
    expect(normalizePlayerName("Ja'Marr Chase")).toBe(normalizePlayerName("Ja'Marr Chase").toLowerCase());
  });

  it("strips apostrophes so a query typed without one still matches", () => {
    expect(normalizePlayerName("De'Von Achane")).toBe("devon achane");
  });

  it("leaves names without apostrophes unaffected apart from casing", () => {
    expect(normalizePlayerName("Patrick Mahomes")).toBe("patrick mahomes");
  });
});
