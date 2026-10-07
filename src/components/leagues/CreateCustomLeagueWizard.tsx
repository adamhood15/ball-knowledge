"use client";

import { useState, useTransition } from "react";
import { LeagueDetailsStep, type LeagueDetails } from "@/components/leagues/LeagueDetailsStep";
import { OwnRosterStep, type OwnRosterPlayer } from "@/components/leagues/OwnRosterStep";
import { RosterConstructionStep } from "@/components/leagues/RosterConstructionStep";
import { CustomSettingsStep } from "@/components/trade/CustomSettingsStep";
import {
  defaultRosterConstructionForCustomLeague,
  defaultScoringSettingsForCustomLeague,
  type CustomLeagueSettings,
} from "@/lib/trade/customLeagueSettings";

type WizardState =
  | { step: "details" }
  | { step: "settings"; details: LeagueDetails }
  | { step: "rosterConstruction"; details: LeagueDetails; settings: CustomLeagueSettings }
  | {
      step: "ownRoster";
      details: LeagueDetails;
      settings: CustomLeagueSettings;
      rosterConstruction: Record<string, number>;
    };

export interface CreateCustomLeagueInput {
  name: string;
  teamCount: number;
  mode: CustomLeagueSettings["leagueType"];
  scoringSettings: Record<string, number>;
  rosterConstruction: Record<string, number>;
  myTeamRoster?: OwnRosterPlayer[];
}

export function CreateCustomLeagueWizard({
  createCustomLeagueAction,
}: {
  createCustomLeagueAction: (input: CreateCustomLeagueInput) => Promise<void>;
}) {
  const [state, setState] = useState<WizardState>({ step: "details" });
  const [, startTransition] = useTransition();

  if (state.step === "details") {
    return <LeagueDetailsStep onContinue={(details) => setState({ step: "settings", details })} />;
  }

  if (state.step === "settings") {
    return (
      <CustomSettingsStep
        onContinue={(settings) => setState({ step: "rosterConstruction", details: state.details, settings })}
      />
    );
  }

  if (state.step === "rosterConstruction") {
    const { details, settings } = state;
    return (
      <RosterConstructionStep
        initialRosterConstruction={defaultRosterConstructionForCustomLeague(settings)}
        onContinue={(rosterConstruction) => setState({ step: "ownRoster", details, settings, rosterConstruction })}
      />
    );
  }

  const { details, settings, rosterConstruction } = state;

  function finish(myTeamRoster?: OwnRosterPlayer[]) {
    startTransition(() =>
      createCustomLeagueAction({
        name: details.name,
        teamCount: details.teamCount,
        mode: settings.leagueType,
        scoringSettings: defaultScoringSettingsForCustomLeague(settings),
        rosterConstruction,
        myTeamRoster,
      }),
    );
  }

  return (
    <OwnRosterStep
      rosterConstruction={rosterConstruction}
      onContinue={(players) => finish(players)}
      onSkip={() => finish(undefined)}
    />
  );
}
