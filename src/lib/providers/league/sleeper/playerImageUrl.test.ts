import { describe, expect, it } from "vitest";
import { playerImageUrl } from "@/lib/providers/league/sleeper/playerImageUrl";

describe("playerImageUrl", () => {
  it("returns the per-player headshot URL for a regular player", () => {
    expect(playerImageUrl({ canonicalPlayerId: "4137", position: "RB" })).toBe(
      "https://sleepercdn.com/content/nfl/players/thumb/4137.jpg",
    );
  });

  it("returns the team logo URL for a DEF entry", () => {
    expect(playerImageUrl({ canonicalPlayerId: "KC", position: "DEF" })).toBe(
      "https://sleepercdn.com/images/team_logos/nfl/kc.png",
    );
  });
});
