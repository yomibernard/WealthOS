# Changelog

## Unreleased — Phase 8.2

- Hosted pilot smoke: `npm run smoke:hosted` + health `config.demoMode` / `databaseKind`
- Admin ops post-deploy checklist; DEPLOY.md smoke table

## Unreleased — Phase 8.1

- Privacy export includes monthly reports, weekly digests, adviser shares/nudges, prefs, inbox
- Support & complaints: L2 case form, case list, complaint labelling; admin queue badges

## Unreleased — Phase 8.0

- Demo script Acts 3–5 for cadence + adviser loop; `/demo` jump links
- Admin ops module index for reports, digest, funding, profile, share/nudges

## Unreleased — Phase 7.4

- Notification preference policy helper + `createUserNotification` gating
- Notifications centre UX: channel cards, weekly/monthly generate, preference-aware delivery

## Unreleased — Phase 7.3

- Adviser → customer nudges (data, profile, digest, funding, actions)
- `POST /api/adviser/nudge`; panel on customer 360; inbox deep-links

## Unreleased — Phase 7.2

- Customer → adviser share packs (full / digest / profile / funding)
- `POST /api/adviser/share`; UI on digest, profile, adviser-collab

## Unreleased — Phase 7.1

- Profile completeness checklist engine + actionable `/app/profile`
- Syncs `profileCompleteness` score; Home CTA under 80%; WealthAI intent

## Unreleased — Phase 7.0

- Adviser insights pack on customer 360 (talking points + guardrails)
- `GET /api/adviser/insights/[customerId]` for assigned advisers / admin

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
