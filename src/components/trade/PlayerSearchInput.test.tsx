import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlayerSearchInput } from "@/components/trade/PlayerSearchInput";

function fakeFetchJson(body: unknown) {
  const mock = vi.fn<typeof fetch>();
  mock.mockResolvedValue({ ok: true, json: async () => body } as Response);
  return mock;
}

describe("PlayerSearchInput", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not search for a query under 2 characters", async () => {
    const fetchMock = fakeFetchJson({ results: [] });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<PlayerSearchInput excludeCanonicalPlayerIds={[]} onSelectPlayer={vi.fn()} />);

    await user.type(screen.getByTestId("player-search-input"), "j");

    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches and shows suggestions as the user types", async () => {
    const fetchMock = fakeFetchJson({
      results: [{ canonicalPlayerId: "100", name: "Ja'Marr Chase", position: "WR", nflTeam: "CIN" }],
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<PlayerSearchInput excludeCanonicalPlayerIds={[]} onSelectPlayer={vi.fn()} />);

    await user.type(screen.getByTestId("player-search-input"), "chase");

    await waitFor(() => expect(screen.getByText("Ja'Marr Chase")).toBeInTheDocument());
    expect(fetchMock.mock.calls[0][0]).toContain("q=chase");
  });

  it("scopes the search to a league when leagueId is given", async () => {
    const fetchMock = fakeFetchJson({ results: [] });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<PlayerSearchInput leagueId="league-1" excludeCanonicalPlayerIds={[]} onSelectPlayer={vi.fn()} />);

    await user.type(screen.getByTestId("player-search-input"), "chase");

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toContain("leagueId=league-1");
  });

  it("calls onSelectPlayer and clears the input when a suggestion is picked", async () => {
    const fetchMock = fakeFetchJson({
      results: [{ canonicalPlayerId: "100", name: "Ja'Marr Chase", position: "WR", nflTeam: "CIN" }],
    });
    vi.stubGlobal("fetch", fetchMock);
    const onSelectPlayerMock = vi.fn();
    const user = userEvent.setup();
    render(<PlayerSearchInput excludeCanonicalPlayerIds={[]} onSelectPlayer={onSelectPlayerMock} />);

    await user.type(screen.getByTestId("player-search-input"), "chase");
    await waitFor(() => expect(screen.getByText("Ja'Marr Chase")).toBeInTheDocument());
    await user.click(screen.getByText("Ja'Marr Chase"));

    expect(onSelectPlayerMock).toHaveBeenCalledWith({
      canonicalPlayerId: "100",
      name: "Ja'Marr Chase",
      position: "WR",
      nflTeam: "CIN",
    });
    expect(screen.getByTestId("player-search-input")).toHaveValue("");
    expect(screen.queryByText("Ja'Marr Chase")).not.toBeInTheDocument();
  });

  it("excludes already-added players from suggestions", async () => {
    const fetchMock = fakeFetchJson({
      results: [
        { canonicalPlayerId: "100", name: "Ja'Marr Chase", position: "WR", nflTeam: "CIN" },
        { canonicalPlayerId: "200", name: "Tee Higgins", position: "WR", nflTeam: "CIN" },
      ],
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<PlayerSearchInput excludeCanonicalPlayerIds={["100"]} onSelectPlayer={vi.fn()} />);

    await user.type(screen.getByTestId("player-search-input"), "wr");

    await waitFor(() => expect(screen.getByText("Tee Higgins")).toBeInTheDocument());
    expect(screen.queryByText("Ja'Marr Chase")).not.toBeInTheDocument();
  });
});
