# Changelog

## Unreleased — Phase 11.0

- Adviser portfolio care filters on `/adviser` (`?care=` all / care / complaints / privacy / support)

## 0.1.3 — 13 Aug 2026 (Adviser care pack)

Adviser-facing care desk, portfolio radar, and customer acknowledgments on top of the 0.1.2 trust loop.

### Phase 10.x — Adviser care

- **10.3** Freeze pack `v0.1.3`; `pilot:freeze` covers 10.x care surface
- **10.2** Care acknowledgment from 360 (`POST /api/adviser/care-ack`) → Inbox; ops queues stay authoritative
- **10.1** Portfolio care radar on `/adviser` (complaints → privacy → cases)
- **10.0** Care desk on customer 360 + insights talking points before product talk

## 0.1.2 — 13 Aug 2026 (Customer trust loop)

In-product support, privacy, and notification deep-links on top of the 0.1.1 ops pack.

### Phase 9.x — Trust loop

- **9.4** Freeze pack `v0.1.2`; `pilot:freeze` covers 9.x surface
- **9.3** Notification centre deep-links; demo Act 5 trust/privacy loops
- **9.2** Privacy-request Home pulse + Inbox → `/app/privacy`
- **9.1** Support/complaint Inbox lifecycle → `/app/support`
- **9.0** Home case CTAs; WealthAI `support_case` / `privacy` intents

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
