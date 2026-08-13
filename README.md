# WealthOS MVP

Nigeria-first, mobile-first **AI Personal Wealth Operating System**.

> Know what you have. Know where you are going. Know what to do next.

## Stack

- Next.js 15 (App Router) + TypeScript
- Prisma + SQLite (local MVP; swap to Postgres for production)
- Deterministic financial engines (net worth, FX, health, goals, suitability, NBFA, WealthGuard)
- Multi-agent WealthAI orchestration with tool/service calls
- Vitest for engine and AI policy tests

## Quick start

```bash
cp .env.example .env   # Windows: copy .env.example .env
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Repo: [github.com/yomibernard/WealthOS](https://github.com/yomibernard/WealthOS). CI runs on every push to `main`.

### Demo accounts

Password for all: `WealthOSdemo1!`

| Email | Role |
|-------|------|
| yomi@demo.wealthos.ng | Persona A — Nigerian executive |
| amaka@demo.wealthos.ng | Persona B — Entrepreneur |
| chioma@demo.wealthos.ng | Persona C — Diaspora |
| adviser@demo.wealthos.ng | Adviser portal |
| admin@demo.wealthos.ng | Admin portal (maker) |
| checker@demo.wealthos.ng | Admin portal (checker) |

## Optional LLM polish

Set `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`) to enable a grounded explanation polish layer. Calculations still come only from deterministic engines; invented percentages are rejected.

## Partner execution (Phase 2 demo)

Material recommendations can be sent to a demo regulated-partner rail after step-up code `123456`. Flow: consent → instruction → partner confirmation → receipt. **No real funds move.** See **More → Partner executions**.

## Open banking + pensions (Phase 3.1 demo)

- **Connections** — connect demo banks, consent-gated sync, disconnect pauses consent. No real bank login.
- **Pension** — `/app/pension` aggregates RSA and foreign pots with an illustrative retirement gap.

## Inbox, life events, estate (Phase 3.2)

- **Wealth Inbox** — `/app/inbox` consolidates actions, connection issues, and estate gaps.
- **Life events** — recording an event creates planning checklists and inbox follow-ups (never auto-invests).
- **Estate lite** — `/app/estate` tracks will / beneficiary readiness; not legal advice.

## Adviser collab, tax, perf (Phase 3.3)

- **Adviser portal** — shared/internal notes + customer timeline on each customer 360.
- **Customer** — `/app/adviser-collab` for shared notes; `/app/tax` for illustrative Nigeria tax awareness.
- **Perf** — after build, `npm run perf:check` enforces `perf-budget.json`.

## Crypto + lending awareness (Phase 4.0)

- **Crypto lite** — `/app/crypto` records holdings for net worth only. Trading, live prices, and token recommendations are explicitly deferred.
- **Lending awareness** — `/app/lending` shows debt service pressure. No loan offers or credit decisioning.

## Postgres production path

Local MVP uses SQLite (`DATABASE_URL="file:./dev.db"`). Full cutover checklist: **[POSTGRES_CUTOVER.md](./POSTGRES_CUTOVER.md)**.

```bash
npm run db:postgres-ready          # static readiness
npm run db:up                      # docker compose Postgres
npm run db:use-postgres            # switch schema + install migrations
npx prisma migrate deploy          # apply prisma/migrations-postgres
npm run db:use-sqlite              # return local MVP to SQLite
```

Init SQL lives in `prisma/migrations-postgres/` so SQLite `db:push` is undisturbed.

## Ops, demo, launch freeze (Phase 4.1)

- **Ops runbook** — [OPS_RUNBOOK.md](./OPS_RUNBOOK.md)
- **Launch freeze** — [LAUNCH_REVIEW.md](./LAUNCH_REVIEW.md) + `npm run launch:check`
- **Demo script** — [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) and presenter UI at `/demo`
- **Health** — `GET /api/health` for uptime probes
- **Admin** — `/admin/ops` launch gate summary

## Demo & ops (Phase 8.x)

- Presenter script: [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) + `/demo` (Acts 1–5)
- Privacy export: `/app/privacy` (includes digests, shares, nudges)
- Support & complaints: `/app/support` → admin `/admin/escalations` (care-ack cues); Support lists recent adviser care updates
- Privacy queue: `/admin/privacy` (care-ack cues + Care desk link); customer `/app/privacy` lists recent care updates
- Hosted smoke: `SMOKE_BASE_URL=https://… npm run smoke:hosted` (includes support/privacy/care-updates)
- Daily ops board: `/admin/ops` (attention queues + care handoff)
- Audit export: `/admin/audit` (filter + Download JSON)
- Flag profiles: `/admin/flags` (safe pilot / incident lockdown)
- Pilot freeze: `npm run pilot:freeze` (v0.1.6 customer care loop pack)
- Adviser care: `/adviser` radar (`?care=` incl. unacked) → 360 Care desk (history + optional ack)
- Home shows open/recent support cases; care-update pulse after adviser ack; ask WealthAI about support or privacy export
- Admin module index: `/admin/ops`

## Notification preferences (Phase 7.4)

- `/app/notifications` controls Critical / Important / Advisory / Informational
- Digests and monthly reports require Informational; adviser nudge alerts require Important

## Adviser nudges (Phase 7.3)

- Advisers can request customers to refresh data, complete profile, generate digest, review funding/actions
- Lands in customer inbox with a deep link; no product execution

## Share with adviser (Phase 7.2)

- Customers can share digest / profile / funding / full briefing packs with a linked adviser
- Appears in adviser notes as `customer_share` and in collaboration thread

## Profile completeness (Phase 7.1)

- **Profile** — `/app/profile` checklist with Fix links; score synced to `profileCompleteness`
- Home prompts completion when under 80%

## Adviser insights (Phase 7.0)

- **Customer 360** — insights pack with talking points and guardrails for human review
- API: `GET /api/adviser/insights/[customerId]` (adviser/admin)

## Weekly digest (Phase 6.4)

- **Digest** — `/app/digest` one-page weekly summary (position, data quality, funding, inbox)
- Flag `FF_WEEKLY_DIGEST`; respects informational notification preferences

## Goal funding pulse (Phase 6.3)

- **Funding** — `/app/plan/funding` shows illustrative monthly gaps and lets you apply suggested contributions
- Does not execute investments — plan choice only

## Data confidence (Phase 6.2)

- **Remediation** — `/app/wealth/confidence` lists stale/estimated holdings with confirm or update actions
- Home surfaces **Fix data quality** when confidence is low or valuations are stale

## Monthly reports (Phase 6.0–6.1)

- **Reports** — `/app/reports` generates an informational monthly snapshot (net worth, health, attention, next steps)
- MoM insights + sparkline; print/save PDF on detail; inbox notice on generate
- History stored as `WealthSnapshot`; flag `FF_MONTHLY_REPORTS`
- Respects informational notification preferences

## CI, deploy, pilot (Phase 5.0)

- **CI** — `.github/workflows/ci.yml` (install → SQLite setup → test → build → `release:check`)
- **Env template** — [`.env.example`](./.env.example)
- **Deploy / pilot** — [DEPLOY.md](./DEPLOY.md) · `vercel.json` / `npm run build:vercel`
- **Release** — git tags `v0.1.0`–`v0.1.6` (MVP → … → ops care → customer care); `npm run pilot:freeze`
- Status freeze: [MVP_STATUS.md](./MVP_STATUS.md)

## Scripts

- `npm run dev` — local app
- `npm run test` — engine / AI tests
- `npm run db:setup` — push schema + seed
- `npm run build` — production build
- `npm run launch:check` — env/policy launch gate
- `npm run release:check` — umbrella gate (launch + postgres-ready + perf if built)
- `npm run smoke` — HTTP journey smoke (requires `npm run dev`)
- `npm run perf:check` — post-build bundle budgets
- `npm run db:postgres-ready` — static Postgres cutover readiness
- `npm run db:rehearse-postgres` — Docker migrate+seed rehearsal (requires Docker Desktop)

## Product principles (enforced in code)

1. Customer before product  
2. Goal before investment  
3. Suitability before return  
4. Explain before execute  
5. Consent before action  
6. Protect before optimise  
7. AI does not invent balances, returns, fees or regulatory status  

See `GAP_ASSESSMENT.md` for the greenfield audit and epic map.
