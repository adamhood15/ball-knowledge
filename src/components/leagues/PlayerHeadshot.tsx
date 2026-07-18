"use client";

import { useState } from "react";

export function PlayerHeadshot({ src, className = "" }: { src: string; className?: string }) {
  const [hasError, setHasError] = useState(false);

  const boxClassName = `h-12 w-12 flex-shrink-0 border-2 border-card-border/70 ${className}`;

  if (hasError) {
    return <div data-testid="player-headshot-placeholder" className={`${boxClassName} bg-card-border/10`} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- Sleeper CDN headshot, see TeamCard.tsx for why not next/image
    <img
      src={src}
      alt=""
      data-testid="player-headshot-image"
      onError={() => setHasError(true)}
      className={`${boxClassName} object-cover`}
    />
  );
}
