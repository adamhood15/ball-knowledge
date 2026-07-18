import { describe, expect, it } from "vitest";
import { sleeperTeamLogoUrl } from "@/lib/providers/league/sleeper/teamLogoUrl";

describe("sleeperTeamLogoUrl", () => {
  it("builds a Sleeper CDN team logo URL, lowercasing the team abbreviation", () => {
    expect(sleeperTeamLogoUrl("KC")).toBe("https://sleepercdn.com/images/team_logos/nfl/kc.png");
  });
});
