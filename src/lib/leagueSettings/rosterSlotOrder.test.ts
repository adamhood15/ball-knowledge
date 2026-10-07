import { describe, expect, it } from "vitest";
import { expandRosterConstructionToSlots, ROSTER_SLOT_ORDER } from "@/lib/leagueSettings/rosterSlotOrder";

describe("ROSTER_SLOT_ORDER", () => {
  it("orders slots QB, RB, WR, TE, FLEX, SUPERFLEX, K, DEF, BENCH", () => {
    expect(ROSTER_SLOT_ORDER).toEqual(["QB", "RB", "WR", "TE", "FLEX", "SUPERFLEX", "K", "DEF", "BENCH"]);
  });
});

describe("expandRosterConstructionToSlots", () => {
  it("repeats each slot type by its count, in fixed order", () => {
    const slots = expandRosterConstructionToSlots({ QB: 1, RB: 2, WR: 2, DEF: 1 });

    expect(slots).toEqual(["QB", "RB", "RB", "WR", "WR", "DEF"]);
  });

  it("omits a slot type entirely when its count is zero or absent", () => {
    const slots = expandRosterConstructionToSlots({ QB: 1, SUPERFLEX: 0 });

    expect(slots).toEqual(["QB"]);
  });

  it("returns an empty list for an empty roster construction", () => {
    expect(expandRosterConstructionToSlots({})).toEqual([]);
  });
});
