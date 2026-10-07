"use client";

import { useState } from "react";
import { TradeSetupStep, type TradeSetupLeague } from "@/components/trade/TradeSetupStep";
import { CustomSettingsStep } from "@/components/trade/CustomSettingsStep";
import { TradeSearchStep } from "@/components/trade/TradeSearchStep";
import type { CustomLeagueSettings } from "@/lib/trade/customLeagueSettings";
import type { PlayerSearchResult } from "@/lib/trade/searchPlayers";

type WizardState =
  | { step: "setup" }
  | { step: "customSettings" }
  | { step: "search"; leagueId: string | null; customSettings: CustomLeagueSettings | null }
  | {
      step: "results";
      leagueId: string | null;
      customSettings: CustomLeagueSettings | null;
      givingAssets: PlayerSearchResult[];
      receivingAssets: PlayerSearchResult[];
    };

export function TradeWizard({ leagues }: { leagues: TradeSetupLeague[] }) {
  const [state, setState] = useState<WizardState>({ step: "setup" });

  if (state.step === "setup") {
    return (
      <TradeSetupStep
        leagues={leagues}
        onSelectLeague={(leagueId) => setState({ step: "search", leagueId, customSettings: null })}
        onUseCustomSettings={() => setState({ step: "customSettings" })}
      />
    );
  }

  if (state.step === "customSettings") {
    return (
      <CustomSettingsStep
        onContinue={(customSettings) => setState({ step: "search", leagueId: null, customSettings })}
      />
    );
  }

  if (state.step === "search") {
    return (
      <TradeSearchStep
        leagueId={state.leagueId ?? undefined}
        onAnalyze={(givingAssets, receivingAssets) =>
          setState({ ...state, step: "results", givingAssets, receivingAssets })
        }
      />
    );
  }

  // Balance beam + scored verdict lands here next.
  return (
    <div data-testid="trade-results-step-placeholder" className="flex flex-col gap-2">
      <p className="text-sm text-muted-text">
        Analyzing {state.givingAssets.length} for {state.receivingAssets.length}…
      </p>
      <p className="text-xs text-muted-text">Results view coming next.</p>
    </div>
  );
}
