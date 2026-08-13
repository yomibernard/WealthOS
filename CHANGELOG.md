# Changelog

## Unreleased — Phase 6.4

- Weekly wealth digest engine + `/app/digest` (position, data quality, funding, inbox)
- `GET/POST /api/digest/weekly`; flag `FF_WEEKLY_DIGEST`; WealthAI `weekly_digest` intent

## Unreleased — Phase 6.3

- Goal funding pulse engine + `/app/plan/funding` with apply-suggested / custom monthly
- `POST /api/goals/[id]/funding`; Home/Plan entry points; WealthAI `goal_funding` intent

## Unreleased — Phase 6.2

- Data quality remediation engine + actionable `/app/wealth/confidence` queue
- `POST /api/wealth/refresh` confirm/update valuations; Home “Fix data quality” CTA
- WealthAI `data_quality` intent

## Unreleased — Phase 6.1

- Month-over-month insights engine + net-worth sparkline on `/app/reports`
- Print / save PDF on report detail; inbox item when a report is generated
- WealthAI `monthly_report` intent

## Unreleased — Phase 6.0

- Monthly wealth report centre at `/app/reports` with snapshot history and detail views
- Structured report payload (sections, top actions, disclaimer); GET/POST `/api/reports/monthly`

## 0.1.0 — 13 Aug 2026 (MVP freeze + pilot package)

### Phase 5.0 — CI / deploy package

- GitHub Actions CI: test, build, `release:check` on SQLite
- `.env.example` for clone-and-run
- `DEPLOY.md` pilot hosting checklist (Vercel + Postgres, Docker Compose)
- `vercel.json` + `npm run build:vercel` (Postgres migrate + Next build)
- Release tag `v0.1.0`
- Repo published at github.com/yomibernard/WealthOS

## 0.1.0 — 13 Aug 2026 (MVP freeze candidate)

Nigeria-first AI Personal Wealth Operating System MVP.

### Product

- Six modules: WealthAI, Wealth Graph, Wealth Health, WealthPlan, WealthAction, WealthGuard
- Wealth Check onboarding, consent centre, adviser + admin (maker-checker) portals
- Deterministic engines: net worth, FX, health, goals/NBFA, suitability, cash-flow, property, business, insurance, pension, tax lite, crypto lite, lending awareness, estate lite, life-event automation
- Wealth Inbox, partner execution demo (`fundsMoved: false`), open-banking demo rail
- Privacy centre (export / erasure), PWA manifest, feature flags, rate limits

### Ops / launch

- `OPS_RUNBOOK.md`, `LAUNCH_REVIEW.md`, `DEMO_SCRIPT.md`, `/demo`, `/admin/ops`
- `GET /api/health`, `npm run launch:check`, `npm run release:check`
- Postgres path: `POSTGRES_CUTOVER.md`, `prisma/migrations-postgres`, `docker-compose.yml`
- `npm run db:rehearse-postgres` when Docker Desktop is running

### Explicitly deferred

- Live trading, loan origination, real open-banking credentials, payments super-app
- Full WCAG audit certification, legal/regulatory public launch sign-off

### Demo

Password: `WealthOSdemo1!` — see README / `/demo` for accounts.
