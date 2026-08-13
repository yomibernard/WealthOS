# Changelog

## Unreleased — Phase 9.2

- Home privacy-request pulse; Inbox cards on create/update → `/app/privacy`
- Pref-aware notifications for privacy requests; refreshInbox covers open privacy queue

## Unreleased — Phase 9.1

- Wealth Inbox deep-links for support/complaint create + resolve (→ `/app/support`)
- Refresh inbox includes in-progress cases; open cards no longer route to adviser-request

## Unreleased — Phase 9.0

- Home CTAs for open/recent support & complaint cases
- WealthAI `support_case` and `privacy` intents (paths to `/app/support`, `/app/privacy`)

## 0.1.1 — 13 Aug 2026 (Pilot ops pack)

Post-MVP ops, cadence, and adviser-loop hardening for closed pilots.

### Phase 8.x — Ops & trust

- **8.7** Pilot freeze check (`npm run pilot:freeze`); version align to 0.1.1
- **8.6** Feature-flag profiles on `/admin/flags` (full demo / safe pilot / incident lockdown)
- **8.5** Admin audit filter + redacted JSON export (`GET /api/admin/audit?download=1`)
- **8.4** Daily ops board (`/admin/ops`, `/admin`, `GET /api/admin/ops-daily`)
- **8.3** Escalation/complaint resolution (`PATCH /api/admin/escalations`)
- **8.2** Hosted smoke (`npm run smoke:hosted`) + health `config.demoMode` / `databaseKind`
- **8.1** Privacy cadence export + `/app/support` L2 cases
- **8.0** Demo/ops sync for cadence + adviser loop

### Phase 7.x — Adviser loop & prefs

- Adviser insights, profile completeness, share packs, nudges, notification prefs

### Phase 6.x — Cadence

- Monthly reports, MoM insights, data confidence, goal funding, weekly digest

## 0.1.0 — 13 Aug 2026 (MVP freeze + pilot package)

- Nigeria-first WealthOS MVP: Wealth Graph, Health, Plan, Actions/NBFA, WealthAI, WealthGuard
- Adviser + admin/maker-checker portals, consent/privacy, demo personas
- CI, Vercel `build:vercel`, Postgres cutover rehearsal, tag `v0.1.0`
- `OPS_RUNBOOK.md`, `LAUNCH_REVIEW.md`, `DEMO_SCRIPT.md`, `/demo`, `/admin/ops`

### Explicitly deferred

- Live trading, loan origination, real open-banking credentials, payments super-app
- Full WCAG audit certification, legal/regulatory public launch sign-off

### Demo

Password: `WealthOSdemo1!` — see README / `/demo` for accounts.
