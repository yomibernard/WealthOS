# Changelog

## Unreleased

### Phase 23.x — Adviser WealthAI book next-steps

- **23.0** `/adviser/ai` + `POST /api/adviser/ai` grounds “What should I do next for my book?” on the Care radar pulse

## 0.1.15 — 14 Aug 2026 (Adviser book next-steps pack)

Adviser book next-steps on Care radar on top of the 0.1.14 Home next-steps pulse pack.

### Phase 22.x — Adviser book next-steps

- **22.2** Freeze pack `v0.1.15`; `pilot:freeze` covers 22.x adviser book next-steps surface
- **22.1** Smoke asserts adviser next-steps kind + first href are adviser paths
- **22.0** Ranked adviser book next-steps on `/adviser`; `GET /api/adviser/next-steps`; Care desk / filter deep links

## 0.1.14 — 14 Aug 2026 (Home next-steps pulse pack)

Ranked Home next-steps with deep links on top of the 0.1.13 Wealth Inbox triage pack.

### Phase 21.x — Home next-steps pulse

- **21.2** Freeze pack `v0.1.14`; `pilot:freeze` covers 21.x next-steps surface
- **21.1** Smoke asserts next-steps `primaryHref` + WealthAI “What should I do next?” path grounding
- **21.0** Ranked Home next-steps with deep links; `GET /api/next-steps`; WealthAI “what should I do next?” grounded on the pulse

## 0.1.13 — 14 Aug 2026 (Wealth Inbox triage pack)

Customer Wealth Inbox triage on top of the 0.1.12 customer notification triage pack.

### Phase 20.x — Wealth Inbox triage

- **20.2** Freeze pack `v0.1.13`; `pilot:freeze` covers 20.x inbox triage surface
- **20.1** Smoke covers inbox kind filters (recommendation/adviser/connection/data_quality) + labeled mark-all-read; hosted hits recommendation/adviser
- **20.0** Customer `/app/inbox` unread/kind triage + mark-all-read; Home unread deep-link; smoke paths

## 0.1.12 — 14 Aug 2026 (Customer notification triage pack)

Customer-facing notification triage on top of the 0.1.11 adviser notification triage pack.

### Phase 19.x — Customer notification triage

- **19.2** Freeze pack `v0.1.12`; `pilot:freeze` covers 19.x customer triage surface
- **19.1** Smoke covers customer mark-all-read + cadence/care triage paths; hosted hits care_update/cadence filters
- **19.0** Customer `/app/notifications` unread/kind triage + mark-read/mark-all; Home unread pulse; seed cadence + care mix

## 0.1.11 — 14 Aug 2026 (Adviser notification triage pack)

Triage filters and mark-all-read on top of the 0.1.10 adviser notification centre pack.

### Phase 18.x — Adviser notification triage

- **18.2** Freeze pack `v0.1.11`; `pilot:freeze` covers 18.x triage surface
- **18.1** Smoke covers triage query paths + `POST /api/notifications/mark-all-read`; hosted hits unread/care-receipt filters
- **18.0** Unread/kind filters + mark-all-read on `/adviser/notifications`; seed share + care receipt for Ada

## 0.1.10 — 14 Aug 2026 (Adviser notification centre pack)

Adviser-facing notification centre on top of the 0.1.9 care receipt close-loop pack.

### Phase 17.x — Adviser notifications

- **17.2** Freeze pack `v0.1.10`; `pilot:freeze` covers 17.x adviser notification surface
- **17.1** Smoke covers adviser `/api/notifications` + mark-as-read; hosted smoke hits the notifications API
- **17.0** `/adviser/notifications` with unread pulse, mark-as-read, and Care desk deep-links

## 0.1.9 — 13 Aug 2026 (Care receipt close-loop pack)

Adviser notify + ops receipts + awaiting radar on top of the 0.1.8 care receipts pack.

### Phase 16.x — Care receipt close-loop

- **16.2** Freeze pack `v0.1.9`; `pilot:freeze` covers 16.x close-loop surface
- **16.1** Smoke covers adviser `?care=awaiting` + admin `/admin/ops` (local + hosted)
- **16.0** Adviser notify on mark-as-seen; ops recent receipts + awaiting count; `/adviser?care=awaiting`

## 0.1.8 — 13 Aug 2026 (Care receipts pack)

Customer mark-as-seen receipts on adviser care updates on top of the 0.1.7 WealthAI care pack.

### Phase 15.x — Care receipts

- **15.2** Freeze pack `v0.1.8`; `pilot:freeze` covers 15.x care receipt surface
- **15.1** Seeded Yomi care_ack for demo/smoke receipts; hosted smoke hits `/api/care-updates?list=1`
- **15.0** Care receipts: mark as seen (optional thanks); Home pulse unseen-only; Care desk Seen/Unseen

## 0.1.7 — 13 Aug 2026 (WealthAI care pack)

WealthAI answers adviser care-update questions on top of the 0.1.6 customer care loop.

### Phase 14.x — WealthAI care

- **14.3** Freeze pack `v0.1.7`; `pilot:freeze` covers 14.x WealthAI care surface
- **14.2** Smoke covers `/app/ai` + local care_update chat probe; demo Act 5 WealthAI care-update question
- **14.1** WealthAI `care_update` answers grounded in the live care-update pulse (count/headline/path)
- **14.0** WealthAI `care_update` intent routes adviser-acknowledgment questions to Support/Privacy Home paths (ops still authoritative)

## 0.1.6 — 13 Aug 2026 (Customer care loop pack)

Customer-visible care acknowledgments on Home, Support, and Privacy on top of the 0.1.5 ops care pack.

### Phase 13.x — Customer care loop

- **13.3** Freeze pack `v0.1.6`; `pilot:freeze` covers 13.x customer care surface
- **13.2** Privacy Centre care updates; smoke covers support/privacy/`/api/care-updates`
- **13.1** Support page recent care updates (`GET /api/care-updates`)
- **13.0** Home care-update pulse for recent adviser acknowledgments

## 0.1.5 — 13 Aug 2026 (Ops care handoff pack)

Ops visibility into adviser care acknowledgments on top of the 0.1.4 care UX pack.

### Phase 12.x — Ops care handoff

- **12.3** Freeze pack `v0.1.5`; `pilot:freeze` covers 12.x ops care surface
- **12.2** Admin privacy queue care-ack badge + Care desk deep-link
- **12.1** Admin escalations queue care-ack badge + Care desk deep-link
- **12.0** Daily ops `care_handoff` queue + recent adviser acks → `/adviser?care=unacked`

## 0.1.4 — 13 Aug 2026 (Adviser care UX pack)

Care radar filters, acknowledgment history, and unacked cues on top of the 0.1.3 care pack.

### Phase 11.x — Care UX

- **11.3** Freeze pack `v0.1.4`; `pilot:freeze` covers 11.x care UX surface
- **11.2** Care radar last-ack cues + `?care=unacked` filter
- **11.1** Care acknowledgment history on customer 360 Care desk
- **11.0** Portfolio care filters (`?care=` all / care / complaints / privacy / support)

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
