"use client";

import { useState } from "react";
import { PlayerSelectCard } from "@/components/trade/PlayerSelectCard";
import { CloseIcon } from "@/components/icons/CloseIcon";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";

export interface TradeablePlayer {
  canonicalPlayerId: string;
  name: string | null;
  position: string | null;
  nflTeam: string | null;
}

export interface TradeTeamSide {
  teamName: string;
  players: TradeablePlayer[];
}

function TeamColumn({
  team,
  selectedIds,
  onToggle,
}: {
  team: TradeTeamSide;
  selectedIds: Set<string>;
  onToggle: (playerId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-display text-lg text-body-text">{team.teamName}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {team.players.map((player) => (
          <PlayerSelectCard
            key={player.canonicalPlayerId}
            playerName={player.name ?? `Unknown player (${player.canonicalPlayerId})`}
            position={player.position}
            nflTeam={player.nflTeam}
            isSelected={selectedIds.has(player.canonicalPlayerId)}
            onToggle={() => onToggle(player.canonicalPlayerId)}
          />
        ))}
      </div>
    </div>
  );
}

export function TradeBuilder({
  myTeam,
  opponentTeam,
}: {
  myTeam: TradeTeamSide;
  opponentTeam: TradeTeamSide;
}) {
  const [selectedMyPlayerIds, setSelectedMyPlayerIds] = useState<Set<string>>(new Set());
  const [selectedOpponentPlayerIds, setSelectedOpponentPlayerIds] = useState<Set<string>>(new Set());
  const [isProposalExpanded, setIsProposalExpanded] = useState(false);

  function toggleSelection(setSelected: typeof setSelectedMyPlayerIds, playerId: string) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
  }

  const totalSelectedCount = selectedMyPlayerIds.size + selectedOpponentPlayerIds.size;
  const selectedMyPlayers = myTeam.players.filter((player) => selectedMyPlayerIds.has(player.canonicalPlayerId));
  const selectedOpponentPlayers = opponentTeam.players.filter((player) =>
    selectedOpponentPlayerIds.has(player.canonicalPlayerId),
  );

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-10 pb-28">
      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
        <TeamColumn
          team={myTeam}
          selectedIds={selectedMyPlayerIds}
          onToggle={(playerId) => toggleSelection(setSelectedMyPlayerIds, playerId)}
        />
        <TeamColumn
          team={opponentTeam}
          selectedIds={selectedOpponentPlayerIds}
          onToggle={(playerId) => toggleSelection(setSelectedOpponentPlayerIds, playerId)}
        />
      </div>

      {totalSelectedCount > 0 ? (
        <div
          className={[
            "fixed inset-x-0 bottom-0 border-t-2 border-muted-text/30 bg-background transition-all duration-200",
            isProposalExpanded ? "top-16" : "",
          ].join(" ")}
        >
          {isProposalExpanded ? (
            <div data-testid="trade-proposal-panel" className="flex h-full flex-col gap-6 overflow-y-auto p-6">
              <div className="mx-auto flex w-full max-w-4xl items-center justify-between">
                <h2 className="font-display text-xl text-body-text">Trade Proposal</h2>
                <IconButton aria-label="Close" onClick={() => setIsProposalExpanded(false)}>
                  <CloseIcon className="h-3.5 w-3.5" />
                </IconButton>
              </div>
              <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm text-muted-text">You give</h3>
                  {selectedMyPlayers.map((player) => (
                    <p key={player.canonicalPlayerId} className="text-body-text">
                      {player.name}
                    </p>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm text-muted-text">You get</h3>
                  {selectedOpponentPlayers.map((player) => (
                    <p key={player.canonicalPlayerId} className="text-body-text">
                      {player.name}
                    </p>
                  ))}
                </div>
              </div>
              <Button className="mx-auto">Analyze Trade</Button>
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-4xl items-center justify-between p-4">
              <p className="text-sm text-muted-text">{totalSelectedCount} player(s) selected</p>
              <Button onClick={() => setIsProposalExpanded(true)}>View Proposal</Button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
