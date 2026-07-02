# RoofRx — AI Onboarding

This doc exists so any AI agent (Claude Code, a future model, a different tool entirely) can pick up this project with full context, without the owner having to re-explain it. Read this before `CLAUDE.md` and `docs/deployment.md` — those cover the codebase and infra; this covers the business.

## Technical documentation index

Start here, then follow links for the depth you need:

- [docs/architecture.md](architecture.md) — System overview, network topology, CI/CD pipeline, dual-brand build system, and a clear list of what is live vs. what is still planned.
- [docs/infrastructure.md](infrastructure.md) — Phase-by-phase VPS reproduction guide. Phase 1 (Tailscale + SSH hardening) is complete; Phases 2–5 are TODO stubs that get filled in as tickets close.
- [docs/runbook.md](runbook.md) — Day-to-day and emergency operational procedures: checking service status, deploying manually, rolling back, and recovering from a locked-out VPS.
- [docs/secrets-registry.md](secrets-registry.md) — Every GitHub secret and variable, what each contains, which workflows use it, and what breaks if it is missing.

## Company structure

RoofRx Services (`roofrxservices.com`) is the primary brand and the only one that should receive differentiated positioning, messaging, content, or strategy. Intermountain Roofing (`intermtnroofing.com`) is a backup/insurance brand only — a near-identical clone with the logo and brand name swapped, sharing the same codebase via `scripts/apply-brand.mjs`. Any RoofRx decision applies identically to Intermtn unless the owner explicitly says otherwise. Never propose separate strategy or content for Intermtn — that's a signal something has gone off track.

The domain is `roofrxservices.com` — not `roofrx.com`. This has been a recurring source of errors; verify it everywhere (DNS, env vars, schema markup, config files).

GitHub repo: `github.com/nbegmatov/roofrx` (private).

## Market

Residential-first, commercial also in scope. Geographic footprint spans two distinct contexts that should both show up in service-area content, not just one:

- Denver metro + Front Range — suburban homeowners
- Aspen and Vail — mountain resort properties

Treat these as different customer contexts (different pain points, different price sensitivity, different seasonal patterns), not a single undifferentiated service area.

## Crew model

Hybrid: some in-house crews, some subcontracted. Wherever scheduling, insurance/bonding coverage, or subcontractor onboarding (W9/1099, agreements) comes up, both crew types need to be covered — don't default to writing only for one.

## Growth channel priority (launch order)

1. Organic SEO / content (blog, raw video — owner on roofs, talking to camera)
2. LSA / paid ads
3. Referrals & reputation (reviews, word of mouth)
4. Storm response / door-knocking (lowest priority for now)

Organic content takes months to compound, so content infrastructure is early-priority work even though it's channel #1 rather than the fastest channel to results — don't deprioritize it just because it's "slow."

## Target launch

May 2027.

## Operating principles

Source: Roofing Insights podcast (Adam Sand & Sam Cook). These are standing principles, not one-time advice:

- **Security first.** Tailscale VPN + real credential hygiene before wiring backend services. Don't build new integrations on infrastructure that's still publicly exposed.
- **Hire, don't drown.** The owner should stay in business strategy, not get pulled into deep technical weeds. When scoping work, flag what genuinely needs the owner's direct involvement vs. what can be delegated or automated.
- **Raw human content outperforms polished AI-generated content.** This applies to marketing content specifically — don't default to generating slick AI copy/video where raw, owner-on-camera content was the explicit strategy.
- **Referrals are the highest-ROI channel long-term**, even though they're ranked #3 in initial launch sequencing (sequencing ≠ priority).
- **Daily AI ops briefing** (leads, tickets, calendar) and **automated financial oversight** (QuickBooks AR/AP) are core operating habits, not optional extras — treat related tickets (RRX-015, RRX-026) as load-bearing, not nice-to-have.

## Compliance flags — launch blockers

The live site currently displays "BBB A+," "warranty-backed," and "licensed & insured" claims with nothing behind them yet. Treat licensing, insurance, bonding, and manufacturer certification as launch blockers, not background tasks. Don't let marketing/content work outpace the legal foundation — if asked to build something that depends on a claim not yet substantiated (e.g. a warranty page, an insurance badge), flag the dependency rather than building on top of it.

## Asset storage model

- `/assets/` in repo → deployed static assets
- Google Drive → master brand source files
- IONOS Object Storage → runtime-generated files (photos, generated docs)

## Work tracking

Work is tracked in a kanban board (12 epics, ticket IDs prefixed `RRX-XXX`), built as a Claude artifact (React + `window.storage`). Artifacts are sandboxed per-chat and do not sync automatically across conversations — if ticket status matters for a decision, ask the owner whether the board has been updated rather than assuming the repo state matches the board state, or vice versa.

Phase order on the board: Phase 0 (Business & Legal) → Phase 1 (GHL & Sequences / Backend & VPS / Website Fixes / Marketing & Brand) → Phase 2 (Operations) → Phase 3 (Scale).

## Tools & accounts

See `docs/accounts.md` for the registry of which accounts exist, under what email, and what they're for. That file documents ownership facts only — never credential values.
