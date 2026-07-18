import { describe, expect, it } from "vitest";
import { sleeperHeadshotUrl } from "@/lib/providers/league/sleeper/headshotUrl";

describe("sleeperHeadshotUrl", () => {
  it("builds a Sleeper CDN thumbnail URL for the given canonical player ID", () => {
    expect(sleeperHeadshotUrl("4137")).toBe("https://sleepercdn.com/content/nfl/players/thumb/4137.jpg");
  });
});
