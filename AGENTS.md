# AGENTS.md — operating instructions for this repository

This file tells a coding agent (Claude Code or similar) how to work in this repository. It does not repeat the product spec — `roadmap.md` in the repo root is the single source of truth for *what* to build, phase by phase. This file governs *how* to build it: workflow discipline, coding standards, and conventions that must hold across every phase.

Read `roadmap.md` in full before writing any code. If anything in this file and `roadmap.md` conflict, `roadmap.md` wins on product scope; this file wins on process and code style.

---

## 1. How to work through this project

- **One phase at a time, in the order defined in `roadmap.md` section 5.** Do not start Phase N+1 until Phase N's "Definition of done" is fully met and its tests pass. The phases are ordered with real dependencies between them (documented in roadmap.md section 6, "Process") — skipping ahead will produce code that depends on things that don't exist yet.
- At the start of each phase, restate the phase's scope and Definition of done back before starting implementation, so scope is confirmed before work begins.
- At the end of each phase, run the full test suite, confirm the Definition of done line-by-line, and treat that as a PR/review checkpoint before moving on — don't silently roll into the next phase in the same breath.
- **Checkpoint after every discrete feature, not just at phase boundaries.** When one user-visible feature (a form, a page, a nav element, a bug fix) is done, tested, and green, stop and tell the human what changed and how to see/test it themselves — then wait for their go-ahead before starting the next feature. Don't chain multiple unrelated features together in one uninterrupted burst just because they were requested in the same message; the human wants the chance to look at and test each one before the next begins.
- If a phase's scope is ambiguous or a requirement conflicts with something built in an earlier phase, stop and ask rather than guessing — but only for genuine blockers. For implementation-level decisions not specified in the roadmap (e.g. exact function signatures, file layout within a module), use your judgment and proceed; don't ask permission for every small decision.
- **Resolve high-severity dependency vulnerabilities and build/config breakages before moving to the next checklist item — never defer or silently accept them.** If `npm install`/`npm audit` surfaces a high-severity finding, or the build/typecheck/test pipeline breaks because of a tooling or configuration incompatibility, treat that as a blocker for the current item: find the actual fix (swap the dependency, use its underlying library directly, pin a different version) rather than noting the risk and continuing. Don't ask permission to investigate the fix itself, but if the fix requires a real architectural tradeoff (e.g. which library to depend on), surface the options and confirm before proceeding, per the rule above.

## 2. Test-driven development — non-negotiable

This project is built test-first, for every feature, every phase, no exceptions:

1. Write a failing test that specifies the expected behavior.
2. Run it, confirm it fails for the right reason (not a typo or setup error).
3. Write the minimum implementation to make it pass.
4. Refactor with the suite green.
5. Only then move to the next unit of work.

Practical rules:
- Every phase's Definition of done in `roadmap.md` lists specific test scenarios — these are required test cases, not suggestions. Treat them as a checklist.
- Pure logic (scoring math, replacement value, grade formula, the lineup optimizer) is tested with fixtures and mocks — no database or network calls in these tests.
- Provider adapters (Sleeper, ESPN, the FantasyPros projections client) are tested against **recorded fixture responses**, never live API calls, so the suite is deterministic and doesn't break when a season rolls over or an external API is rate-limited. Store fixtures alongside the tests that use them (e.g. `__fixtures__/sleeper/`).
- Every bug fix ships with a regression test that fails against the old code and passes against the fix.
- The valuation engine and grading logic are the core value proposition of this app — hold them to a higher coverage bar than peripheral UI code. If you have to triage, triage there last.

## 3. Code quality standards

- Clean, readable code over clever code. Small, single-purpose functions. TypeScript strict mode everywhere; no `any` in the valuation engine or provider adapters.
- **Name every variable for exactly what it holds.** No generic names (`data`, `value`, `item`, `temp`, `result`, `x`) when a specific name is available — `weeklyProjectedPointsByPlayer`, not `data`; `replacementLevelPointsPerGame`, not `value`; `startingLineupSlotsRemaining`, not `count`. This applies to loop variables and intermediate results, not just top-level state. A reviewer should understand what a variable contains from its name alone.
- DRY: shared logic lives in one place and gets imported, never copy-pasted across providers or modules. Before writing a new helper, check whether an equivalent one already exists.
- Keep the `LeagueProvider` interface as the single seam between platform-specific code (Sleeper, ESPN) and the rest of the app. Platform quirks stay inside their adapter and never leak into the valuation engine or UI. Same principle for `ProjectionsProvider` (FantasyPros today, swappable later).
- Keep the valuation engine's stages (projections → scoring adjustment → risk → team context → comparison) as separate, independently testable modules with clear input/output contracts. Do not collapse them into one large function for convenience, even when it would be shorter.
- Every module whose output feeds the rationale generator (Phase 6+) must return a structured, labeled object (`{ component, impact, direction, magnitude }`), never a bare number.
- Keep provider credentials and encryption keys out of source control from Phase 0 onward — environment variables only, and never logged.
- **No page or card may block its render on unbounded or O(n) external work when the actual need is O(1) or small-n.** Concretely: never fetch or upsert more data than the view in front of the user actually requires (e.g. a roster of ~15-20 players must never trigger a write of Sleeper's entire ~12k-player list just to resolve a few missing names — filter to the specific IDs needed first). Prefer targeted lookups over "refresh everything, then read the one thing I need." If a data source only exposes a bulk endpoint, fetch the bulk payload but keep the *write* (DB upsert, cache set) scoped to what's actually needed for the current request — the network round-trip may be unavoidable, but sequential per-row DB writes for thousands of irrelevant rows on the request path is not. When work genuinely can't be scoped down (e.g. the routine daily full crosswalk sync), it must run out-of-band (background job, deferred `after()`, cron) rather than blocking a user-visible response.

## 4. Repository conventions

Suggested structure (adjust as the app grows, but keep the separation of concerns intact):

```
/app or /pages          — Next.js routes
/components              — UI components, organized by feature not by type
/lib/valuation            — the valuation engine: one file/module per stage
/lib/providers/league     — SleeperProvider, EspnProvider, LeagueProvider interface
/lib/providers/projections — FantasyProsProvider, ProjectionsProvider interface
/lib/rationale             — template-based rationale generator
/prisma                   — schema, migrations
/__tests__ or colocated *.test.ts — see testing conventions below
/__fixtures__              — recorded API responses for provider tests
roadmap.md                — product spec, phase source of truth (do not edit without the human's request)
AGENTS.md                 — this file
```

- Colocate tests with the code they test where the framework supports it; otherwise mirror the source structure under `__tests__`.
- One module = one responsibility. If a file is doing scoring adjustment *and* risk adjustment, split it — these are separate valuation stages by design (see `roadmap.md` section 5, Phases 3–5).

## 5. Design system quick reference

Full direction is in `roadmap.md` section 3. **The authoritative, up-to-date
reference for shape, shadow, and color-state rules is `design.md`** at the repo
root — read it before styling any new component. It supersedes the "glow"
guidance below: the app moved from soft glow shadows to hard, non-blurred
offset shadows with per-state color rules (rest/hover/focus/selected), and
`design.md` documents exactly which color means what. Quick reference for the
rest of the palette:

**Governing rule:** retro skin, modern UX. Visual language is arcade/VHS/synthwave; interaction patterns, accessibility, and responsiveness stay fully modern. When the two conflict, usability wins.

**Mobile-first, for every screen and component, not just the grade card.** This ships as a PWA — design and build layout for a 375px-wide viewport first, then progressively enhance upward for larger screens, not the other way around. Concretely: before considering any new or changed UI done, check it at 375px width and confirm nothing overflows, wraps awkwardly, or gets visually squished — headers, nav bars, cards, forms, tables included. When horizontal space is tight, prefer wrapping, stacking, truncating, or hiding secondary content over letting elements crowd each other; the primary action (e.g. a Log Out button) must never lose room to a nice-to-have (e.g. a greeting message).

| Token | Dark mode (primary) | Light mode |
|---|---|---|
| Background | `#0c0620` | `#f5f1ff` |
| Card border / accent | `#ff2fb0` | `#d6157e` |
| Secondary accent | `#00fff0` / `#7ef4ff` | `#067a72` / `#067a86` |
| Grade gradient stops | `#ffe98a → #ff2fb0 → #7ef4ff` | `#b8860b → #d6157e → #067a86` |
| Body text | `#e6e1f5` | `#1a1030` |
| Muted text | `#a99fd1` | `#5c4f80` |

- Fonts: Orbitron (display numbers, headers — used sparingly), VT323 (small arcade-flavored accent labels), a clean modern sans for all body text and data-dense UI. Never put stat tables, rosters, or rationale text in a display or arcade-mono face.
- Shape/shadow language: 90° corners everywhere, hard non-blurred offset shadows (never `blur`/glow), shadow color encodes interaction state. See `design.md` for the full state-rules table before writing any new className.
- Validate WCAG AA contrast on both modes before finalizing any color that deviates from the table above.
- Build and test the grade reveal card at mobile width (375px) before tuning effect intensity further — this is a PWA, mobile is not an afterthought.

## 6. Environment variables

Set these up in Phase 0, never commit real values:

```
DATABASE_URL
REDIS_URL
NEXTAUTH_SECRET
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
FANTASYPROS_API_KEY
ESPN_CREDENTIAL_ENCRYPTION_KEY     # application-level encryption for SWID/espn_s2, Phase 10
```

## 7. Git and PR conventions

- Branch per phase (or per sub-feature within a large phase): `phase-3-scoring-adjustment`, not generic branch names.
- Commit messages describe what changed and why in plain terms, not implementation narration — `Add bye-week-aware usable games remaining calculation`, not `Update valuation.ts`.
- Each phase's PR description should explicitly check off that phase's Definition of done from `roadmap.md`, so review is against a concrete checklist, not a vibe check.
- Do not modify `roadmap.md` scope unilaterally — if implementation reveals the roadmap needs to change, flag it and confirm with the human before proceeding on a changed scope.

## 8. When something is genuinely unclear

Ask rather than guess when:
- A requirement in one phase seems to conflict with something already built in an earlier phase.
- A platform integration (Sleeper, ESPN) behaves differently than `roadmap.md` section 7 describes.
- A decision would be expensive to reverse later (schema design that's hard to migrate, a third-party dependency commitment).
- **A feature's user flow isn't fully mapped out.** If `roadmap.md` names a step or screen but doesn't pin down the exact sequence, what's asked at each step, or how a step's choices affect what's stored (e.g. what a "platform" selector in a multi-step flow actually maps to in the data model) — stop and ask for the flow before building screens/ordering around a guess, rather than picking a reasonable-sounding interpretation and moving on.

Don't ask, just proceed with a reasonable default, when:
- It's a naming, file-organization, or implementation-detail choice not specified in the roadmap.
- The roadmap already gives enough detail to make the call (e.g. exact test scenarios are listed — write them).
