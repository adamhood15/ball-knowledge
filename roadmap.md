# Fantasy Football Trade Analyzer — Project Roadmap

**Purpose of this document:** a complete, phased build plan for a fantasy football trade analyzer PWA. This is written to be handed directly to a coding agent (e.g. Claude Code) as the source of truth for the build. Each phase is scoped to be shippable and testable on its own before moving to the next.

---

## 1. Product summary

A progressive web app that lets a fantasy football league:
1. Sync league data (rosters, scoring settings, members) from Sleeper and ESPN
2. Input or override league scoring settings manually
3. Evaluate proposed trades with a scoring-settings-aware, roster-context-aware valuation engine
4. Get a 0–100 trade grade with a plain-language, template-generated rationale
5. Support both redraft and dynasty league modes
6. Log in via Google OAuth or email

---

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js (React, TypeScript) | SSR for shareable trade pages, PWA-friendly |
| Styling | Tailwind CSS | |
| Backend | Node.js/TypeScript, colocated in Next.js API routes or a separate Nest/Express service if it outgrows API routes | One language across stack |
| Database | PostgreSQL | Relational fit for league → team → roster → player |
| ORM | Prisma | Type-safe, migration-friendly, pairs well with TDD |
| Cache | Redis | Player data, league data, computed valuations |
| Auth | Auth.js (NextAuth) | Google OAuth + email/magic link |
| PWA | Web app manifest via Next.js metadata API + `workbox-build` | Service worker (`public/sw.js`) is generated from `public/sw-src.js` by a plain postbuild script calling `workbox-build`'s `injectManifest` directly — not a next.config bundler plugin. `next-pwa` is unmaintained (last published 2022) and, like `@serwist/next`, hooks `next.config`'s `webpack()` function, which hard-errors under Next.js 16's Turbopack-by-default build. `@serwist/turbopack` is a newer, less-proven alternative. Decided in Phase 0; see that phase's PR for the full comparison. |
| Testing | Vitest (unit/integration), Playwright (e2e) | See section 5 |
| Player projections | FantasyPros public API (free tier) for v1 | Free for personal/non-commercial use, fits this app; revisit a paid provider (SportsData.io, Fantasy Nerds) only if the app ever needs to scale beyond personal league use — see note below |
| Deployment | Vercel (frontend/API) + managed Postgres (Supabase/Neon/RDS) + managed Redis | |

**Projections provider decision (v1):** use the FantasyPros public API. It's free for personal, non-commercial use, requires requesting an API key with a short description of intended use (not instant self-serve, but not paid), and returns actual rankings/projections rather than just raw historical stats. Two constraints to build around: attribution is required if any output using this data is ever published or shared outside the league, and player headshot images from FantasyPros' API cannot be used without separate Sportradar permission — a non-issue here since headshots are already sourced from Sleeper's free CDN instead. If the app ever grows beyond this league (e.g. other leagues start using it, or it takes on any commercial dimension), FantasyPros' free tier explicitly excludes that use case and a paid provider (SportsData.io, Fantasy Nerds) would need to be swapped in — the `LeagueProvider`-style adapter pattern used for Sleeper/ESPN should extend to a `ProjectionsProvider` interface for exactly this reason, so swapping providers later doesn't touch the valuation engine itself.

---

## 3. Design direction

**Governing principle: retro skin, modern UX.** The visual language (color, typography, motion, chrome effects) is arcade/VHS/synthwave. The underlying interaction patterns, information hierarchy, accessibility, and responsive behavior stay fully modern — this is a modern app wearing a retro aesthetic, not a literal recreation of 90s software. Never let a period-accurate visual choice compromise usability; when the two conflict, usability wins and the retro treatment gets dialed back for that element.

**Two modes, one structure.** Dark mode ("neon cabinet") is the primary, fully-specified direction: near-black background, glowing magenta card border, a perspective-tilted cyan grid at the base of key cards, a subtle scanline texture, and chrome-gradient text (gold → magenta → cyan) reserved for high-impact numbers like the trade grade. Light mode is not a separate aesthetic — it's the same structure (same grid, same scanlines, same chrome-gradient technique on the grade number) with every color re-tuned for contrast against a pale background rather than literally inverted RGB values, since a literal inversion of light-on-dark colors goes muddy on white.

Reference palette (validated in the design mockup, adjust as needed once real content is in place):

| Token | Dark mode | Light mode |
|---|---|---|
| Background | `#0c0620` | `#f5f1ff` |
| Card border / accent | `#ff2fb0` (magenta glow) | `#d6157e` (deeper magenta, lighter glow) |
| Secondary accent | `#00fff0` / `#7ef4ff` (cyan) | `#067a72` / `#067a86` (dark teal) |
| Grade gradient stops | `#ffe98a → #ff2fb0 → #7ef4ff` | `#b8860b → #d6157e → #067a86` |
| Body text | `#e6e1f5` | `#1a1030` |
| Muted text | `#a99fd1` | `#5c4f80` |

Typography: **Orbitron** for display numbers and headers (used with restraint — the trade grade, the app wordmark), **VT323** for small arcade-flavored accent labels (eyebrows, tags), and a clean modern sans (e.g. Space Grotesk) for all body text and data-dense UI. Never set stat tables, rosters, or long-form rationale text in a display or monospace-arcade face — those stay in the plain sans for legibility.

**Reserve retro effects for a handful of moments**, not the whole UI: the trade grade reveal, the app header/wordmark, and confirmation moments (e.g. a trade proposal being sent) are where glow, the grid motif, and scanlines earn their place. Rosters, scoring settings tables, and the trade builder itself should carry the same color and type language but stay closer to a plain, high-contrast card treatment — dense data is exactly where heavy chrome effects hurt readability most.

**Other decisions carried over from earlier discussion:**
- Player headshots: source from Sleeper's free image CDN (`sleepercdn.com`), keyed off the player IDs already pulled during roster sync — no additional integration cost for leagues on Sleeper.
- Accessibility: validate WCAG AA contrast on both modes before finalizing exact hex values, especially for grade color-coding (a low grade vs. a high grade should be distinguishable by more than hue alone).
- Progressive disclosure: lead with the grade as the clear focal point on any trade result; expand supporting detail (component breakdown, both-sides rationale, balancing suggestions) rather than surfacing all of it at once.
- Mobile-first: since this ships as a PWA, test the heaviest retro-styled component (the grade reveal card) at mobile width before finalizing effect intensity — glow and grid effects that work at desktop scale can overwhelm a 375px screen.

---

## 4. Data model (core entities)

```
User            — id, email, name, auth provider links
LinkedCredential— userId, platform (sleeper/espn), externalId, encryptedCookie? (ESPN only)
League          — id, platform, externalLeagueId, name, mode (redraft/dynasty), scoringSettings (jsonb),
                   rosterConstruction (jsonb), createdByUserId (the commissioner who first synced it)
LeagueInvite    — id, leagueId, invitedEmail, unclaimedExternalTeamId, status (pending/claimed/expired), token
Team            — id, leagueId, ownerId (User), externalTeamId
Roster          — teamId, snapshotAt, players[] (denormalized snapshot per sync)
Player          — canonicalId (Sleeper-anchored), name, position, nflTeam, byeWeek, platformIdCrosswalk (jsonb)
Projection      — playerId, week/season, statLine (jsonb), variance, injuryRisk
TradeProposal   — id, leagueId, teamsInvolved[], assetsByTeam (players + picks, up to 5 assets per team),
                   proposedByUserId, status (draft/proposed/accepted/rejected/countered/expired),
                   respondedAt, createdAt
TradeGrade      — tradeProposalId, teamId, score (0-100), componentBreakdown (jsonb), rationale[]
DraftPick       — id, leagueId, ownerTeamId, season, round, originalTeamId (dynasty only)
Notification    — id, userId, type (trade_proposed/trade_accepted/trade_rejected/trade_countered/sync_failed),
                   relatedTradeProposalId?, readAt
```

`scoringSettings`, `rosterConstruction`, and `componentBreakdown` are JSON blobs because scoring stat categories, starting lineup slot configurations, and rationale components all vary in shape across leagues, platforms, and phases — don't force a rigid relational schema on data that's inherently flexible. `rosterConstruction` should be a list of starting slots and counts (e.g. `{ QB: 2, RB: 2, WR: 2, FLEX: 2, TE: 1, BENCH: 6 }` for a two-QB, double-flex league) rather than hardcoded columns — every downstream module that reasons about starting lineups (positional need, scarcity, the lineup optimizer) must read from this config rather than assuming a standard 1QB/2RB/2WR/1TE/1FLEX layout.

**Multi-user note:** since the whole league signs in (not just one person), `TradeProposal.status` and `Notification` exist specifically so a proposal can actually be delivered to and answered by another real user, not just evaluated privately. Accepting a trade in-app records mutual agreement — it does **not** execute anything on Sleeper/ESPN, since their APIs are read-only for third parties. The in-app "accepted" status is bookkeeping that tells both managers the trade is agreed and ready to be keyed into the platform itself.

---

## 5. Feature phases

Each phase below is a milestone: build it, test it, ship it, then move on. Do not start a phase's implementation before its tests are written (see section 5 — this applies to every phase equally).

### Phase 0 — Foundation
- Next.js + TypeScript project scaffold, PWA manifest + service worker shell (no offline logic yet, just installability)
- Postgres + Prisma schema for `User`, `League`, `Team`, `Roster`, `Player`
- Auth.js with Google OAuth + email magic link
- CI pipeline: lint, typecheck, test on every PR

**Definition of done:** a user can install the app, log in with Google, and see an empty dashboard.

### Phase 1 — Sleeper integration (read-only)
- `LeagueProvider` interface: `getRosters()`, `getScoringSettings()`, `getLeagueMembers()`
- `SleeperProvider` implementation against the public Sleeper API (no auth required)
- League sync flow: user pastes a Sleeper league ID → pulls rosters, scoring settings, members → stores snapshot
- Player ID crosswalk table seeded from Sleeper's player list (cache daily, per Sleeper's guidance — refresh this endpoint at most once per day)

**Definition of done:** a user links a Sleeper league and sees all team rosters and the league's actual scoring settings in the UI.

### Phase 2 — Manual scoring settings + league setup + member invites
- Scoring settings form (all standard stat categories, editable point values), with PPR / Half-PPR / Standard as selectable presets that populate the reception point value, plus full manual override of any individual stat category
- Roster construction form: configurable starting lineup slots and counts per position (supports standard 1QB layouts as well as two-QB, superflex, and multi-flex leagues) — this feeds `rosterConstruction` and must be read by every module built in later phases rather than assumed
- Manual override path: user can adjust auto-pulled settings or enter them from scratch (for platforms without a sync path)
- League mode toggle: redraft vs dynasty (affects Phase 8)
- **League invite flow**: the user who syncs a league becomes its commissioner/admin; they can invite the rest of the league by email, and each invited user claims the specific team that's actually theirs (matched against the synced platform roster/owner data) rather than every team defaulting to being owned by whoever set the league up

**Definition of done:** a user can view, edit, and save custom scoring settings and roster construction independent of any platform sync, with test coverage for PPR, Half-PPR, and Standard presets and for at least one non-standard roster construction (e.g. two-QB or double-flex). A commissioner can invite a teammate, and that teammate can claim their own team and see only their own roster context as "mine" versus everyone else's.

### Phase 3 — Valuation engine, stages 1–3
Build in this order, each with its own test suite:
1. **Raw projections ingestion** — pull rest-of-season PPG, games remaining, variance, injury risk from the FantasyPros public API (see section 2's provider decision), behind a `ProjectionsProvider` interface so a different provider can be swapped in later without touching the rest of the engine
2. **Scoring adjustment** — convert raw stat projections into league-specific fantasy points using the league's `scoringSettings`
3. **Risk & availability adjustment** — injury status discount, bye-week-aware "usable games remaining" calculation

**Definition of done:** given a player and a league, the engine returns a single league-adjusted, risk-adjusted projected value, with unit tests covering PPR, Half-PPR, and Standard scoring explicitly (not just PPR vs standard), TE premium, bye-week-passed vs not-passed, and current-injury discounting. Provider integration tests run against recorded FantasyPros fixture responses, not live calls, consistent with the fixture-based testing approach in section 6.

### Phase 4 — Roster context module (Stage 4, part 1)
- Replacement value calculator: for a given roster, compute each starter's marginal value over next-best bench option at the same position, with "starter" determined by the league's actual `rosterConstruction` slots — not a hardcoded position layout
- Positional need / roster construction analysis: compare roster depth per position against the league's configured starting requirements, classify surplus/adequate/thin per position, correctly handling multi-slot positions (e.g. a two-QB league's QB need is assessed against 2 starting slots, not 1) and flex-eligible slots
- Positional scarcity: waiver-wire replacement level per position, computed league-wide from all synced rosters (requires Phase 1/2's full roster pull), adjusted for how many slots at that position the league actually starts

**Definition of done:** given a full league snapshot, the engine can answer "what does losing player X cost this specific team" and "how scarce is position Y in this league right now," with tests covering surplus and scarce scenarios, and explicit test fixtures for both a standard 1QB league and a two-QB or superflex league to confirm scarcity/need shift correctly with roster construction.

### Phase 5 — Lineup optimizer (Stage 4, part 2)
- Weekly optimal lineup solver: given a roster, position eligibility, the league's `rosterConstruction` slots (including multi-QB and multi-flex slots), and bye weeks, compute the point-maximizing starting lineup for a given week — the solver must be generic over the slot configuration, not hardcoded to a standard layout
- Season-long optimizer: run the weekly solver across all remaining weeks to get total optimized points
- Trade lineup-impact calculator: run the optimizer on a roster before and after a hypothetical trade, output the delta

**Definition of done:** the "4th RB never starts" scenario is covered by an explicit test — verify that adding a redundant positional asset to an already-deep roster produces a near-zero lineup-impact delta — with the same test repeated against a two-QB/superflex fixture to confirm a redundant QB behaves the same way in a league where QB depth is actually valuable.

### Phase 6 — Trade comparison, grading, and rationale
- Trade comparison endpoint: run both sides of a proposed trade through Stages 1–5, output market value delta and team-specific marginal value delta for each team. Must support multi-player trades — up to 5 players (or player/pick combinations) per side, not just 1-for-1 — with the lineup optimizer and replacement-value calculations run against the full post-trade roster for each team, not evaluated player-by-player in isolation (a 5-for-5 trade's value isn't the sum of five independent 1-for-1 comparisons, since removing and adding multiple players at the same position simultaneously changes replacement value and lineup slots differently than one at a time).
- Grade formula: weighted composite (lineup delta, positional need fit, risk change, market fairness) mapped to a 0–100 scale via a calibrated bounded curve
- Structured component objects: every module above must return labeled `{ component, impact, direction, magnitude }` objects, not just raw numbers — this is what the rationale generator consumes. For multi-player trades, components should be attributable to individual assets where possible (so a 5-for-5 rationale can still call out "Lamb projects for +4.8 PPG over your current WR2" for one specific player within the larger trade) rather than only summarizing the trade as a whole.
- Template-based rationale generator: sorts structured components by magnitude, filters below a "not worth mentioning" threshold, maps each to a template string. No LLM calls in this path.
- **Rationale for both sides of the trade, not just the user's team.** Since the engine already computes grade + component breakdown per team (not just the requesting user's team), the rationale generator should run for both teams involved and the UI should let the user view the other team's rationale alongside their own — this is meant to help the user make their pitch when proposing a trade to a leaguemate, so it should read as a case *for* the trade from that team's perspective, not just a mirrored version of the user's own bullets.
- Trade builder UI: pick two teams, select up to 5 assets (players and/or picks) per side, see the grade and rationale for both sides side by side

**Definition of done:** submitting a trade returns a 0–100 grade for each team, an adjusted PPG delta, and an ordered list of plain-language rationale bullets for both teams involved, each numerically traceable back to that team's own component breakdown. Explicit test coverage must include 1-for-1, uneven trades (e.g. 2-for-1), and the maximum 5-for-5 case, confirming the engine evaluates each team's full resulting roster rather than treating a multi-player trade as several independent 1-for-1 comparisons.

### Phase 7 — Trade proposal delivery and response
Now that the whole league has accounts, a trade proposal needs to actually reach the other manager, not just be evaluated privately.
- Send flow: a user builds a trade (Phase 6's builder) and sends it to the other team's owner rather than only viewing it themselves
- Respond flow: the receiving manager sees the trade, both teams' grades and rationale (including the "case for the trade" framing from their side), and can accept, reject, or counter (counter reopens the builder pre-populated with the original assets, editable)
- Notifications: in-app notification center at minimum (`Notification` entity); PWA push notifications as a stretch within this phase if time allows, otherwise deferred
- Status tracking on `TradeProposal` (proposed/accepted/rejected/countered/expired) — an "accepted" trade is bookkeeping only, a clear signal to both managers that they've agreed and should now go execute the actual trade on Sleeper/ESPN itself, since neither platform's API allows a third party to execute a trade on a user's behalf
- Visibility rules: a team only sees trade proposals involving their own team; tendency notes (Phase 12) about a manager are never visible to that manager or anyone but their author

**Definition of done:** one user can send a trade proposal to another user in the same league, the receiving user gets notified and can accept/reject/counter it, and the resulting status is visible to both sides — with a test confirming a team cannot see a trade proposal it isn't party to.

### Phase 8 — Dynasty mode
- Draft pick modeling: `DraftPick` entity, pick value curve by round and years-out
- Age-curve-adjusted long-term player value
- Contention window parameter per team (manual toggle or record-derived)
- Dynasty-weighted valuation: blend redraft value and long-term value per the contention weight
- Trade grading and rationale extended to surface dynasty-specific components (e.g. "this trade shifts your roster 1.5 years younger"), including for both teams per the Phase 6 both-sides rationale feature

**Definition of done:** the same trade evaluated in redraft mode vs dynasty mode for a rebuilding team produces meaningfully different grades, verified by test cases with an explicit rebuilding-team fixture.

### Phase 9 — PWA hardening
- Full offline behavior: cached rosters/trade proposals viewable offline, clear "last synced at X" state when offline, no stale-data-presented-as-live
- Cache strategy tuning: network-first for live data, cache-first for static assets, stale-while-revalidate for daily-refresh player metadata
- Install prompt UX for Chrome/Edge (`beforeinstallprompt`) and a manual instruction banner for iOS Safari
- If not already built in Phase 7, this is also the natural point to add PWA push notifications for trade proposals/responses

**Definition of done:** the app passes a Lighthouse PWA audit and behaves predictably (not silently stale) when offline.

### Phase 10 — ESPN integration
- `EspnProvider` implementing the same `LeagueProvider` interface
- Public league support (no auth) first
- Private league support: UI flow for a user to input their `SWID`/`espn_s2` cookie values, with clear instructions; encrypt at rest (application-level encryption, not just hashing, since the plaintext is needed for API calls)

**Definition of done:** a user can link a public or private ESPN league with the same downstream valuation/trade experience as Sleeper.

### Phase 11 — Trade balancing suggestions
- Balance suggestion engine: given a proposed trade with a lopsided grade for one team, search that team's roster (and, in dynasty mode, their draft picks) for additional assets that would close the gap toward a fair grade for both sides
- Approach: for the disadvantaged team, evaluate the trade with each candidate "sweetener" from the *advantaged* team's roster added, and re-run the Phase 6 comparison; rank candidates by how close the resulting grade lands to a fair-trade threshold (e.g. within a configurable band around 50) without overcorrecting into unfairness for the other side
- Prioritize the disadvantaged team's realistic asks — surplus-position or bench-tier assets from the advantaged team's roster should generally rank ahead of that team's clear starters, since those are more likely to actually be accepted, even if a starter would mathematically balance the grade faster. Surface both the "minimal add" and, where useful, a couple of alternative options rather than a single fixed suggestion.
- Reuse the Phase 6 comparison and Phase 6/7 rationale generator entirely — a suggestion is really just "re-run trade comparison with one more asset added," so this phase should not need new valuation math, only a search/ranking layer plus new UI to surface suggestions

**Definition of done:** given a trade that grades poorly for one team, the system returns at least one candidate addition from the other team's roster that brings the grade within the configured fairness band for both teams, with tests confirming suggestions are pulled only from assets the suggesting team actually owns and that a trade already within the fairness band returns no suggestions.

### Phase 12 — League-mate tendency profiles
- `OwnerTendency` entity: `teamId`, `tag` (e.g. "favors Cowboys players", "reluctant to trade RBs", "buy-low seller"), `note`, created/owned by the user who entered it — these are subjective, user-submitted observations about a specific leaguemate, not derived from any objective data source, and should be scoped private to the user who created them rather than shared league-wide
- **Keep this layer strictly separate from the objective grade.** The 0–100 grade from Phase 6 must stay driven only by scoring settings, projections, and roster context — it should never be adjusted by a tendency tag, or the grade stops meaning "is this fair" and starts meaning "will this person say yes," which is a different question and would undermine trust in the core number
- New secondary output — **predicted receptiveness** — computed only for display alongside the objective grade, not blended into it: for a tagged tendency like "favors Cowboys players," apply a configurable perceived-value multiplier to matching players (by NFL team, in this example) when generating that team's rationale and when ranking Phase 11 balancing suggestions, so a Cowboys player is more likely to surface as a suggested sweetener to that manager even if an objectively equivalent non-Cowboys player exists
- UI: an optional, clearly-labeled "notes on this manager" section per opposing team, off by default, that only affects the rationale/suggestion phrasing shown to the user — never the grade itself

**Definition of done:** the same trade produces an identical objective grade for a team regardless of whether a tendency tag is set for them, while the balancing-suggestion ranking (Phase 11) and rationale wording visibly shift when a tag is present, verified by a test that asserts grade equality and suggestion-ranking difference across the tagged/untagged cases.

### Phase 13 (future, not in this build) — Playoff odds simulation
Deferred per prior discussion. Monte Carlo season simulation, run nightly per team plus on-demand for trade deltas. Do not start this without a dedicated design pass — it has different infrastructure needs (simulation queue, materially higher compute) than everything above.

---

## 6. Engineering practices — instructions for the coding agent

Follow these for every phase and every feature within a phase, without exception:

### Test-driven development
- **Write the test before the implementation, always.** For every function, module, or endpoint: write a failing test that specifies the expected behavior, confirm it fails for the right reason, then write the minimum code to make it pass, then refactor with the test suite green.
- Every phase's "Definition of done" above includes explicit test scenarios — treat those as required test cases, not suggestions.
- Unit tests for pure logic (scoring math, replacement value, grade formula) should not hit the database or network — use fixtures and mocks.
- Integration tests for provider adapters (Sleeper, ESPN) should run against recorded fixture responses, not live API calls, so the suite is deterministic and doesn't get rate-limited or break when a season rolls over.
- Add a regression test any time a bug is fixed — the test should fail against the old code and pass against the fix.
- Target meaningful coverage on the valuation engine and grading logic specifically (this is the core value proposition of the app) even if peripheral UI code has lighter coverage.

### Code quality
- Favor clean, readable code over clever code. Prefer explicit names over abbreviations, small single-purpose functions over long ones.
- **Name variables for exactly what they hold, every time.** Avoid generic names (`data`, `value`, `item`, `temp`, `result`, `x`) whenever a more specific name is available — prefer `weeklyProjectedPointsByPlayer` over `data`, `replacementLevelPointsPerGame` over `value`, `startingLineupSlotsRemaining` over `count`. This applies to loop variables, intermediate calculation results, and function parameters alike, not just top-level state — a reviewer (human or agent) should be able to understand what a variable contains from its name alone, without tracing back to its assignment.
- DRY: shared logic (e.g. "compute usable games remaining," "map platform player ID to canonical ID") belongs in one place, imported everywhere it's needed — never copy-pasted across providers or modules.
- Keep the `LeagueProvider` interface as the single seam between platform-specific code and the rest of the app; platform quirks (ESPN's cookie auth, Sleeper's rate limits) stay inside their adapter and never leak into the valuation engine or UI.
- Keep the valuation engine's stages (projections → scoring adjustment → risk → team context → comparison) as separate, independently testable modules with clear input/output contracts, matching the phase breakdown above — resist the urge to collapse them into one large function for convenience.
- Type everything (TypeScript strict mode). No `any` in the valuation engine or provider adapters.
- Every module that returns a value used in the rationale (Phase 6) must return a structured, labeled object — never a bare number — so the rationale generator has something to consume.

### Process
- One phase at a time, in the order above (dependencies are ordered intentionally — e.g. Phase 4 requires Phase 1's league-wide roster data, Phase 6 requires Phases 3–5, Phase 7's proposal delivery requires Phase 6's grading to exist first, Dynasty mode is sequenced at Phase 8, ahead of ESPN integration at Phase 10, since it extends the existing valuation engine rather than depending on a second platform integration, and Phase 11's balancing suggestions are sequenced after Dynasty specifically so they can search draft-pick assets as well as players once that's supported).
- Each phase ends with its own PR/review checkpoint against its "Definition of done" before moving to the next phase.
- Keep provider API credentials and encryption keys out of source control; use environment variables from the start (Phase 0).

---

## 7. Platform integration notes (context for whoever builds Phases 1 and 10)

- **Sleeper**: free, public, read-only REST API, no authentication for any endpoint. Rate limit is roughly 90 requests/minute per IP. The full player list endpoint is large (~5MB) and should be cached and refreshed at most once daily, per Sleeper's own guidance.
- **ESPN**: no official public API. Community-standard approach uses ESPN's internal fantasy endpoints. Public leagues need no auth. Private leagues require the user's `SWID` and `espn_s2` cookies, which can only be obtained by the user manually inspecting their browser cookies after logging into ESPN — this cannot be automated. Treat this as an unofficial integration that could break without notice.
- **NFL.com**: no meaningful public or community API exists. Out of scope for automated sync; if needed later, plan for manual roster entry as a fallback rather than scraping.
