"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LeaguesIcon } from "@/components/icons/LeaguesIcon";
import { TradeIcon } from "@/components/icons/TradeIcon";
import { AccountIcon } from "@/components/icons/AccountIcon";

const TRADE_HREF = "/trade/new";

export function BottomNavBar() {
  const pathname = usePathname();

  const isLeaguesActive = pathname === "/dashboard" || pathname.startsWith("/leagues");
  const isAccountActive = pathname.startsWith("/account");

  return (
    <nav className="sticky bottom-0 z-10 flex items-stretch justify-between border-t border-card-border/40 bg-background px-2 pb-[env(safe-area-inset-bottom)]">
      <Link
        href="/dashboard"
        data-testid="nav-leagues"
        className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs ${
          isLeaguesActive ? "text-secondary-accent" : "text-muted-text"
        }`}
      >
        <LeaguesIcon className="h-6 w-6" />
        Leagues
      </Link>

      <div className="relative flex flex-1 items-center justify-center">
        {/* Apex-down triangle, matching the shape the logo itself sits inside: a cyan
            "stroke" layer, a pink offset hard shadow behind it, and a dark fill inset
            between the two so the cyan reads as a ring. */}
        <Link href={TRADE_HREF} data-testid="nav-trade" aria-label="Trade" className="absolute -top-7 left-1/2 h-14 w-16 -translate-x-1/2">
          <span
            aria-hidden="true"
            className="absolute inset-0 translate-x-[3px] translate-y-[3px] bg-card-border [clip-path:polygon(50%_100%,100%_0%,0%_0%)]"
          />
          <span aria-hidden="true" className="absolute inset-0 bg-secondary-accent [clip-path:polygon(50%_100%,100%_0%,0%_0%)]" />
          <span aria-hidden="true" className="absolute inset-[3px] bg-background [clip-path:polygon(50%_100%,100%_0%,0%_0%)]" />
          <span className="relative flex h-full w-full items-center justify-center pb-3 text-card-border">
            <TradeIcon className="h-6 w-6" />
          </span>
        </Link>
      </div>

      <Link
        href="/account"
        data-testid="nav-account"
        className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs ${
          isAccountActive ? "text-secondary-accent" : "text-muted-text"
        }`}
      >
        <AccountIcon className="h-6 w-6" />
        Account
      </Link>
    </nav>
  );
}
