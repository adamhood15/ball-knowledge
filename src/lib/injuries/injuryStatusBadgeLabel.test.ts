import { describe, expect, it } from "vitest";
import { injuryStatusBadgeLabel } from "@/lib/injuries/injuryStatusBadgeLabel";

describe("injuryStatusBadgeLabel", () => {
  it("returns null for a healthy player, so no badge is shown", () => {
    expect(injuryStatusBadgeLabel(null)).toBeNull();
    expect(injuryStatusBadgeLabel("")).toBeNull();
  });

  it("abbreviates Sleeper's single-letter designations the way fantasy players read them", () => {
    expect(injuryStatusBadgeLabel("Questionable")).toBe("Q");
    expect(injuryStatusBadgeLabel("Doubtful")).toBe("D");
  });

  it("uppercases the full-length designations that are already short", () => {
    expect(injuryStatusBadgeLabel("Out")).toBe("OUT");
    expect(injuryStatusBadgeLabel("IR")).toBe("IR");
    expect(injuryStatusBadgeLabel("PUP")).toBe("PUP");
    expect(injuryStatusBadgeLabel("DNR")).toBe("DNR");
  });

  it("falls back to the raw designation, uppercased, for anything it doesn't recognize", () => {
    expect(injuryStatusBadgeLabel("Suspended")).toBe("SUSPENDED");
  });
});
