"use client";

import { useState } from "react";
import { ToggleGroup } from "@/components/trade/ToggleGroup";
import { Button } from "@/components/ui/Button";
import { DEFAULT_CUSTOM_LEAGUE_SETTINGS, type CustomLeagueSettings } from "@/lib/trade/customLeagueSettings";

export function CustomSettingsStep({
  onContinue,
}: {
  onContinue: (settings: CustomLeagueSettings) => void;
}) {
  const [settings, setSettings] = useState<CustomLeagueSettings>(DEFAULT_CUSTOM_LEAGUE_SETTINGS);

  return (
    <div className="flex flex-col gap-6">
      <ToggleGroup
        label="League Type"
        options={[
          { value: "REDRAFT", label: "Redraft" },
          { value: "DYNASTY", label: "Dynasty" },
        ]}
        value={settings.leagueType}
        onChange={(leagueType) => setSettings((current) => ({ ...current, leagueType }))}
      />
      <ToggleGroup
        label="QB Format"
        options={[
          { value: "ONE_QB", label: "1QB" },
          { value: "SUPERFLEX", label: "Superflex" },
        ]}
        value={settings.qbFormat}
        onChange={(qbFormat) => setSettings((current) => ({ ...current, qbFormat }))}
      />
      <ToggleGroup
        label="TE Premium"
        options={[
          { value: "OFF", label: "Off" },
          { value: "ON", label: "On" },
        ]}
        value={settings.tePremium}
        onChange={(tePremium) => setSettings((current) => ({ ...current, tePremium }))}
      />
      <ToggleGroup
        label="Scoring"
        options={[
          { value: "STANDARD", label: "Standard" },
          { value: "HALF_PPR", label: "Half-PPR" },
          { value: "PPR", label: "PPR" },
        ]}
        value={settings.scoring}
        onChange={(scoring) => setSettings((current) => ({ ...current, scoring }))}
      />
      <Button onClick={() => onContinue(settings)} className="self-start">
        Continue
      </Button>
    </div>
  );
}
