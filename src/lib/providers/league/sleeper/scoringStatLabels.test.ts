import { describe, expect, it } from "vitest";
import leagueFixture from "./__fixtures__/league.json";
import {
  SCORING_STAT_CATEGORY_ORDER,
  groupAndLabelScoringSettings,
  scoringStatCategory,
  scoringStatLabel,
} from "@/lib/providers/league/sleeper/scoringStatLabels";

describe("scoringStatLabel", () => {
  it("maps known raw Sleeper stat codes to human-readable labels", () => {
    expect(scoringStatLabel("blk_kick")).toBe("Block Kick");
    expect(scoringStatLabel("pass_td")).toBe("Passing Touchdown");
    expect(scoringStatLabel("rec")).toBe("Reception");
  });

  it("falls back to the raw stat code for anything unmapped", () => {
    expect(scoringStatLabel("some_future_stat")).toBe("some_future_stat");
  });
});

describe("scoringStatCategory", () => {
  it("categorizes passing, rushing, receiving, defense, and special teams stats", () => {
    expect(scoringStatCategory("pass_td")).toBe("passing");
    expect(scoringStatCategory("rush_yd")).toBe("rushing");
    expect(scoringStatCategory("rec_yd")).toBe("receiving");
    expect(scoringStatCategory("int")).toBe("defense");
    expect(scoringStatCategory("fgm_50p")).toBe("specialTeams");
  });

  it("falls back to an 'other' category for anything unmapped", () => {
    expect(scoringStatCategory("some_future_stat")).toBe("other");
  });
});

describe("SCORING_STAT_CATEGORY_ORDER", () => {
  it("orders QB (passing) first, then RB (rushing), WR (receiving), defense, then special teams", () => {
    expect(SCORING_STAT_CATEGORY_ORDER).toEqual(["passing", "rushing", "receiving", "defense", "specialTeams", "other"]);
  });
});

describe("groupAndLabelScoringSettings", () => {
  it("groups the real league's scoring settings by category in the required order, each labeled", () => {
    const groups = groupAndLabelScoringSettings(leagueFixture.scoring_settings);

    expect(groups.map((group) => group.category)).toEqual(
      SCORING_STAT_CATEGORY_ORDER.filter((category) =>
        groups.some((group) => group.category === category),
      ),
    );

    const passingGroup = groups.find((group) => group.category === "passing")!;
    expect(passingGroup.stats.map((stat) => stat.statKey)).toContain("pass_td");
    const passingTd = passingGroup.stats.find((stat) => stat.statKey === "pass_td")!;
    expect(passingTd.label).toBe("Passing Touchdown");
    expect(passingTd.points).toBe(leagueFixture.scoring_settings.pass_td);

    // stats within a group are sorted alphabetically by label
    for (const group of groups) {
      const labels = group.stats.map((stat) => stat.label);
      expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)));
    }
  });

  it("has a specific label/category for every stat the real league actually uses (none fall into 'other')", () => {
    const groups = groupAndLabelScoringSettings(leagueFixture.scoring_settings);
    const otherGroup = groups.find((group) => group.category === "other");
    expect(otherGroup).toBeUndefined();

    const totalStatsAcrossGroups = groups.reduce((total, group) => total + group.stats.length, 0);
    expect(totalStatsAcrossGroups).toBe(Object.keys(leagueFixture.scoring_settings).length);
  });
});
