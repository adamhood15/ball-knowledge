<p align="center">
  <img src="public/logo/ball-knowledge-logo-256x256.png" alt="Ball Knowledge logo" width="128" height="128" />
</p>

<h1 align="center">Ball Knowledge</h1>

<p align="center"><strong>A scoring-settings-aware fantasy football trade analyzer, built as an installable PWA.</strong></p>

---

## What it is

Ball Knowledge lets a fantasy football league sync their actual roster and
scoring data (or enter it manually), then evaluates proposed trades against
*that specific league's* rules — not a generic, scoring-system-agnostic
ranking. The goal is a trade analyzer that accounts for things like:

- Whether the league is PPR, Half-PPR, Standard, or something custom
- TE premium, superflex/two-QB formats, and other non-default scoring or
  roster-construction quirks
- A player's actual bye week and remaining usable games, not just a flat
  per-game average
- The specific roster asking for the trade — the same player trade can be
  worth more or less to a team depending on who else is already on that
  roster

The product spec and full phased build plan live in [`roadmap.md`](roadmap.md).
This README describes what currently exists and runs.

## Current state

The project is being built phase-by-phase per `roadmap.md`. As of this
writing:

- **Phase 0 — Foundation**: done. Next.js + TypeScript scaffold, PWA manifest
  and service worker shell, Postgres/Prisma schema, Auth.js login.
- **Phase 1 — Sleeper integration (read-only)**: done. Paste a Sleeper league
  ID, or pick from the leagues tied to a Sleeper username, and the app pulls
  every team's roster (in the league's actual starting-slot order), the
  league's real scoring settings (human-readable labels, grouped by stat
  category), and lets the syncing user claim which team is theirs.
- **Phase 2 — Manual scoring settings, league setup, invites**: in progress.
  A step-by-step "Create a Custom League" flow (platform → details → scoring
  → roster construction → your own roster) for leagues that don't sync from a
  platform; a read-only scoring-settings/roster-construction page for every
  league regardless of source; win-loss standings; and a commissioner invite
  flow so teammates can claim their own team by email.
- **Phase 3 — Valuation engine, stages 1–3**: in progress. A
  `ProjectionsProvider` backed by the FantasyPros public API, a scoring-stage
  module that converts raw stat projections into this league's fantasy
  points, and a risk/availability stage (bye-week-aware usable-games-remaining,
  injury-risk discounting) compose into a single league-adjusted projected
  value per player.
- **Trade builder**: a working UI shell — pick a league (or custom settings),
  search and select players for both sides of a trade — with the actual
  grading/comparison engine (Phase 6) not yet wired up.

See `roadmap.md` section 5 for the full phase list, including what's still
ahead (lineup optimizer, trade grading + rationale, trade delivery between
managers, dynasty mode, ESPN integration, balancing suggestions, and
league-mate tendency profiles).

## Screenshots

All captured live from the running app, dark mode, mobile viewport.

| Sign in | Dashboard (empty) | Dashboard (with a league) |
|---|---|---|
| ![Sign in](docs/design/screenshots/sign-in.png) | ![Dashboard empty state](docs/design/screenshots/dashboard-empty.png) | ![Dashboard with a league card](docs/design/screenshots/dashboard-with-league.png) |

| Custom league — details | Custom league — scoring | Custom league — roster construction |
|---|---|---|
| ![Wizard step 1](docs/design/screenshots/wizard-step1-details.png) | ![Wizard step 2](docs/design/screenshots/wizard-step2-scoring.png) | ![Wizard step 3](docs/design/screenshots/wizard-step3-roster.png) |

| Custom league — your roster | League standings |
|---|---|
| ![Wizard step 4](docs/design/screenshots/wizard-step4-ownroster.png) | ![League standings](docs/design/screenshots/league-standings.png) |

More screenshots and the full visual-language rationale behind them (color
semantics, shadow/state rules, typography) live in [`design.md`](design.md).

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | [Next.js](https://nextjs.org) 16 (App Router), React 19, TypeScript | Server components + server actions throughout; SSR for shareable pages |
| Styling | Tailwind CSS v4 | Design tokens defined as CSS custom properties, mapped to utilities via `@theme inline` — see `design.md` |
| Database | PostgreSQL | via `pg` + Prisma's driver adapter |
| ORM | [Prisma](https://www.prisma.io) 7 | Generated client checked in under `src/generated/prisma` |
| Cache | [Upstash Redis](https://upstash.com) | Player/league data and computed valuations |
| Auth | [Auth.js](https://authjs.dev) (NextAuth v5) | Google OAuth + email magic link (dev mode logs the link to the console instead of sending real mail) |
| PWA | Web app manifest via Next's metadata API + [`workbox-build`](https://developer.chrome.com/docs/workbox) | Service worker (`public/sw.js`) is generated from `public/sw-src.js` by a plain postbuild script (`scripts/build-service-worker.mjs`) calling Workbox's `injectManifest` directly, rather than a bundler plugin — see `roadmap.md` section 2 for why |
| League data | [Sleeper](https://sleeper.com) public API | Read-only, no auth required; `ESPN` is modeled in the schema for a later phase |
| Player projections | [FantasyPros](https://www.fantasypros.com) public API | Free tier; rest-of-season projections converted into this league's own scoring |
| Testing | [Vitest](https://vitest.dev) (unit + integration), [Playwright](https://playwright.dev) (e2e) | Provider adapters are tested against recorded fixture responses (`__fixtures__/`), never live calls |
| Deployment target | Vercel + managed Postgres + managed Redis | Not yet deployed |

## Architecture

The codebase is organized around a few seams that are meant to stay stable
as the app grows (see [`AGENTS.md`](AGENTS.md) for the full conventions):

- **`LeagueProvider`** (`src/lib/providers/league/LeagueProvider.ts`) — the
  one interface platform-specific league code implements. `SleeperProvider`
  is the only implementation today; an `EspnProvider` lands in a later phase
  behind the same interface, so nothing outside `src/lib/providers/league/sleeper`
  needs to know which platform a league came from.
- **`ProjectionsProvider`** (`src/lib/projections/ProjectionsProvider.ts`) —
  the same pattern for player projections. `FantasyProsProvider` is the only
  implementation today; swapping to a different projections source later
  shouldn't touch the valuation engine.
- **The valuation engine** (`src/lib/valuation/`) — kept as separate,
  independently-testable stages (projections → scoring adjustment → risk/
  availability → …) rather than one large function, matching the phase
  breakdown in `roadmap.md` section 5.
- **`src/lib/leagueSync/`** — turns a `LeagueProvider` snapshot (or a
  manually-entered league) into the app's own Prisma rows, and assembles the
  views (roster + projected value) the UI reads.

## Getting started

### Prerequisites

- Node.js 20+
- A PostgreSQL database
- (Optional for full functionality) a Redis instance, Google OAuth
  credentials, and a FantasyPros API key

### Environment variables

Copy these into a `.env` file at the repo root — see `AGENTS.md` section 6.
None of these should ever be committed with real values.

```
DATABASE_URL
REDIS_URL
NEXTAUTH_SECRET
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
FANTASYPROS_API_KEY
ESPN_CREDENTIAL_ENCRYPTION_KEY     # reserved for the ESPN phase
```

In development, email magic links are logged to the console
(`src/lib/dev-mail.ts`) instead of actually being sent, so a real SMTP
account isn't required to test sign-in locally.

### Install and run

```bash
npm install
npm run prisma:migrate   # applies the Prisma schema to DATABASE_URL
npm run dev              # starts the app at http://localhost:3000
```

### Other scripts

```bash
npm run build        # production build (also regenerates the service worker)
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit, strict mode
npm test              # full unit + integration suite (Vitest)
npm run test:unit     # unit tests only
npm run test:integration  # integration tests only (fixture-backed, no live network/DB calls)
npm run test:e2e      # Playwright end-to-end tests
```

## Project structure

```
src/app/                    — Next.js routes (App Router)
src/components/              — UI components, organized by feature
src/lib/valuation/            — the valuation engine, one module per stage
src/lib/providers/league/     — LeagueProvider interface + SleeperProvider
src/lib/projections/          — ProjectionsProvider interface + FantasyProsProvider
src/lib/leagueSync/           — turns provider/manual data into app state + views
src/lib/trade/                — trade-builder support (player search, custom settings)
src/lib/leagueSettings/       — scoring presets, roster slot ordering, position metadata
prisma/                      — schema and migrations
docs/design/screenshots/     — screenshots referenced from this README and design.md
roadmap.md                   — product spec and phased build plan (source of truth for scope)
AGENTS.md                    — process/workflow and code-style conventions for this repo
design.md                    — the visual design system (colors, type, shape/shadow rules)
```

## Testing philosophy

This project is built test-first (see `AGENTS.md` section 2): a failing test
is written before the implementation it specifies, pure logic (scoring math,
valuation stages) is tested with fixtures and no network/database calls, and
provider adapters are tested against recorded fixture responses
(`__fixtures__/`) rather than live APIs, so the suite stays deterministic.
