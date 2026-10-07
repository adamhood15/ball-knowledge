import { describe, expect, it, vi } from "vitest";
import qbFixture from "./__fixtures__/projections-qb.json";
import rbFixture from "./__fixtures__/projections-rb.json";
import wrFixture from "./__fixtures__/projections-wr.json";
import teFixture from "./__fixtures__/projections-te.json";
import kFixture from "./__fixtures__/projections-k.json";
import dstFixture from "./__fixtures__/projections-dst.json";
import injuriesFixture from "./__fixtures__/injuries.json";
import { FantasyProsProvider } from "@/lib/projections/fantasypros/FantasyProsProvider";

function fakeFetch(responsesByUrlSuffix: Record<string, unknown>) {
  return vi.fn(async (url: string) => {
    const matchingSuffix = Object.keys(responsesByUrlSuffix).find((suffix) => url.endsWith(suffix));
    if (!matchingSuffix) {
      throw new Error(`No fixture registered for fetched URL: ${url}`);
    }
    return {
      ok: true,
      status: 200,
      json: async () => responsesByUrlSuffix[matchingSuffix],
    } as Response;
  });
}

function allPositionResponses() {
  return {
    "/nfl/2026/projections?position=QB": qbFixture,
    "/nfl/2026/projections?position=RB": rbFixture,
    "/nfl/2026/projections?position=WR": wrFixture,
    "/nfl/2026/projections?position=TE": teFixture,
    "/nfl/2026/projections?position=K": kFixture,
    "/nfl/2026/projections?position=DST": dstFixture,
    "/nfl/injuries": injuriesFixture,
  };
}

describe("FantasyProsProvider", () => {
  it("fetches every position and returns one projection per player across all of them", async () => {
    const fetchImpl = fakeFetch(allPositionResponses());
    const provider = new FantasyProsProvider("fake-api-key", fetchImpl);

    const projections = await provider.getSeasonProjections("2026");

    expect(projections).toHaveLength(
      qbFixture.players.length +
        rbFixture.players.length +
        wrFixture.players.length +
        teFixture.players.length +
        kFixture.players.length +
        dstFixture.players.length,
    );
  });

  it("sends the API key in the x-api-key header on every request", async () => {
    const fetchImpl = fakeFetch(allPositionResponses());
    const provider = new FantasyProsProvider("fake-api-key", fetchImpl);

    await provider.getSeasonProjections("2026");

    for (const call of fetchImpl.mock.calls as unknown as [string, RequestInit][]) {
      const headers = call[1]?.headers as Record<string, string> | undefined;
      expect(headers?.["x-api-key"]).toBe("fake-api-key");
    }
  });

  it("maps a QB's raw stats into the canonical stat-line keys", async () => {
    const fetchImpl = fakeFetch(allPositionResponses());
    const provider = new FantasyProsProvider("fake-api-key", fetchImpl);

    const projections = await provider.getSeasonProjections("2026");
    const qb = projections.find((p) => p.name === "Test Quarterback One")!;

    expect(qb.position).toBe("QB");
    expect(qb.nflTeam).toBe("BUF");
    expect(qb.statLine).toEqual({
      pass_yd: 3812.77,
      pass_td: 27.41,
      pass_int: 11.19,
      rush_yd: 585.48,
      rush_td: 11.81,
      fum_lost: 4.1,
      rec: 0,
      rec_yd: 0,
      rec_td: 0,
    });
  });

  it("maps a pass-catcher's receiving stats into the canonical stat-line keys", async () => {
    const fetchImpl = fakeFetch(allPositionResponses());
    const provider = new FantasyProsProvider("fake-api-key", fetchImpl);

    const projections = await provider.getSeasonProjections("2026");
    const rb = projections.find((p) => p.name === "Test Running Back One")!;

    expect(rb.statLine.rec).toBe(70.93);
    expect(rb.statLine.rec_yd).toBe(580.17);
    expect(rb.statLine.rec_td).toBe(4.13);
  });

  it("maps FantasyPros' DST position code to the app's own DEF convention", async () => {
    const fetchImpl = fakeFetch(allPositionResponses());
    const provider = new FantasyProsProvider("fake-api-key", fetchImpl);

    const projections = await provider.getSeasonProjections("2026");
    const dst = projections.find((p) => p.name === "Test City Defense")!;

    expect(dst.position).toBe("DEF");
  });

  it("marks a player with an IR injury status as OUT risk", async () => {
    const fetchImpl = fakeFetch(allPositionResponses());
    const provider = new FantasyProsProvider("fake-api-key", fetchImpl);

    const projections = await provider.getSeasonProjections("2026");
    const injured = projections.find((p) => p.name === "Test Wide Receiver One")!;

    expect(injured.injuryRisk).toBe("OUT");
  });

  it("marks a player with a Questionable injury status as QUESTIONABLE risk", async () => {
    const fetchImpl = fakeFetch(allPositionResponses());
    const provider = new FantasyProsProvider("fake-api-key", fetchImpl);

    const projections = await provider.getSeasonProjections("2026");
    const questionable = projections.find((p) => p.name === "Test Tight End One")!;

    expect(questionable.injuryRisk).toBe("QUESTIONABLE");
  });

  it("marks a player absent from the injuries list as HEALTHY", async () => {
    const fetchImpl = fakeFetch(allPositionResponses());
    const provider = new FantasyProsProvider("fake-api-key", fetchImpl);

    const projections = await provider.getSeasonProjections("2026");
    const healthy = projections.find((p) => p.name === "Test Quarterback One")!;

    expect(healthy.injuryRisk).toBe("HEALTHY");
  });

  it("gives every projection a variance in [0, 1]", async () => {
    const fetchImpl = fakeFetch(allPositionResponses());
    const provider = new FantasyProsProvider("fake-api-key", fetchImpl);

    const projections = await provider.getSeasonProjections("2026");

    for (const projection of projections) {
      expect(projection.variance).toBeGreaterThanOrEqual(0);
      expect(projection.variance).toBeLessThanOrEqual(1);
    }
  });

  it("throws a descriptive error when FantasyPros responds with a non-OK status", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 401 }) as Response);
    const provider = new FantasyProsProvider("fake-api-key", fetchImpl);

    await expect(provider.getSeasonProjections("2026")).rejects.toThrow(/FantasyPros API request failed/);
  });
});
