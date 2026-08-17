# WealthOS MVP — Final Build Report

**Date:** 12 August 2026
**Status:** Phase 1 MVP implemented, tested, and production-build verified

## 1. What was built

Six core modules on a mobile-first Next.js app:

- **WealthAI** — multi-agent orchestration with tool calls into deterministic engines
- **Wealth Graph** — domain schema + manual CRUD with provenance, ownership, multi-currency
- **Wealth Health** — versioned 8-dimension score, explanations, improvement levers
- **WealthPlan** — goals, forecast ranges, Digital Twin Lite, property decision simulator
- **WealthAction** — NBFA including mandatory do-nothing, explainable recs, feedback
- **WealthGuard** — offer analysis with disciplined verification language

Also: landing, Wealth Check, auth, consent, fact-find, products, consent centre, documents, notifications, adviser portal + copilot, admin portal, seed personas A/B/C.

## 2. Architecture summary

Mobile-first Next.js UI → Route Handlers (BFF) → Session / Consent / RBAC → Wealth domain (Prisma) → Deterministic engines → WealthAI orchestrator → Compliance / Audit events.

Stack: Next.js 15, TypeScript, Prisma/SQLite, Zod, Tailwind v4, Vitest.

## 3. Data model changes

Greenfield Prisma schema for User, Household, Income, Expense, Asset, Liability, Goal, RiskProfile, Provider, Product, Recommendation, SuitabilityAssessment, Consent, Document, Conversation/Message, MemoryEntry, Notification, Escalation, AuditEvent, LifeEvent, AdviserCustomer, HealthScoreConfig, WealthSnapshot, WealthGuardAnalysis, FxRate.

## 4. AI architecture

Customer → Conversation → Intent classification → Agent routing → Customer Wealth Graph → Financial engines → Suitability/Compliance → Explanation → Consent → (Phase 2 execution partners).

LLM role in MVP: interpretation/explanation layer is rule+template grounded on engine outputs (no free-form inventing of balances/returns/fees/licence status). Tools only; no transaction credentials in the AI path.

## 5. Security controls

- HTTP-only session cookie, SameSite=Lax
- Password hashing (bcrypt)
- RBAC (CUSTOMER / ADVISER / ADMIN)
- Secrets in env (not frontend)
- Separated conversation / recommendation / consent / execution concepts
- Prompt-injection soft defence + suitability bypass refusal
- Document content redaction for injection markers
- Audit events for auth, recommendations, consent, WealthGuard, escalations, product status
- Rate limiting / MFA / malware scanning: designed; MFA and full malware pipeline deferred to hardened production ops

## 6. Compliance controls

- Deterministic suitability engine with logged rules/outcomes/version
- Consent gate for WealthAI personalisation
- Vulnerable-customer escalation
- WealthGuard language policy (no automatic scam/fraud/safe/guaranteed labels)
- Product approval/suspension with audit (maker-checker stub via checkerNote)
- Human escalation levels L0–L5

## 7. Tests run

- Vitest: 7 files, **20/20 passed** (net worth, health, suitability, NBFA, goals, WealthGuard, AI orchestration)
- `next build`: **success** (48 routes)
- Seed + DB push: success

## 8. Issues found

- Greenfield repo (only PRD + research HTML) — full scaffold required
- create-next-app blocked by capitalised folder name — manual scaffold used
- ESLint unused var / prefer-const failures during first build — fixed
- npm install slow on first run

## 9. Issues fixed

- Lint blockers in goals.ts and wealth-health.ts
- Sign-out UX simplified to client fetch
- WealthGuard known-provider list typo cleaned
- Seed password messaging aligned

## 10. Outstanding risks

- Session cookie auth is demo-grade (not full OIDC/MFA)
- No live open banking / SEC registry API — provider verification uses reference list
- FX rates are seeded, not live market feed
- LLM provider not wired; orchestrator is governed deterministic+template (safe for MVP thesis)
- SQLite not for multi-tenant production scale
- Accessibility: semantic labels/focus present; full WCAG audit still needed
- Legal/regulatory sign-off required before public launch

## 11. Features deferred (Phase 2+)

Live marketplace execution, open banking aggregation, pension aggregation, Wealth Inbox, life-event automation, insurance underwriting, property marketplace, crypto, lending, payments super-app, social/community, referral gamification, full estate/will admin.

## 12. Recommended Phase 2 backlog

1. Partner execution rails with step-up auth + receipts
2. Live FX + SEC/PENCOM verification adapters
3. Real LLM tool-calling with policy output filter
4. Postgres + encrypted document object storage
5. Open banking consent + connection health
6. Full WCAG 2.2 AA audit + performance budgets on 3G
7. Model monitoring dashboards for hallucination/suitability metrics
8. Formal maker-checker dual control for admin config

## 13. MVP journey validation evidence

| Journey | Evidence |
|---------|----------|
| Wealth Check | `/wealth-check` conversational fact-find → net worth + health + top actions |
| Auth | sign-in/up APIs + demo users seeded |
| Wealth Graph | `/app/wealth`, add asset/liability API |
| Net worth / confidence | engines + Home/Wealth/Confidence pages |
| Health | `/app/health` + dimension detail |
| Goals / scenarios | `/app/plan`, forecast, `/app/plan/scenarios` |
| WealthAI grounded | `/api/ai/chat` + orchestration tests |
| NBFA + do-nothing | nbfa tests + `/app/actions` |
| Suitability | suitability tests + product compare |
| WealthGuard | wealthguard tests + `/app/wealthguard` |
| Consent revoke | Consent Centre + AI consent gate |
| Human escalation | adviser request + escalations API/admin |
| Audit | structured AuditEvent + admin audit view |
| Adviser / Admin | `/adviser`, `/admin` portals |
| Build/tests | 20 tests green; production build green |

## Demo logins

Password: `WealthOSdemo1!`

- yomi@demo.wealthos.ng — executive
- amaka@demo.wealthos.ng — entrepreneur
- chioma@demo.wealthos.ng — diaspora
- adviser@demo.wealthos.ng — adviser
- admin@demo.wealthos.ng — admin

Start: `npm run db:setup && npm run dev`

## Phase 2.0 delivered (12 Aug 2026)

- FX adapter + `/admin/fx` refresh
- Provider registry adapter wired into WealthGuard
- True maker-checker (`admin` proposes, `checker` approves; self-approve blocked)
- `/admin/monitoring` AI quality dashboard
- Step-up code `123456` for material recommendation acceptance (no execution yet)
- Connection health model + Connections screen
- Seed: checker@demo.wealthos.ng

24 tests green; 55 routes build clean.

## Phase 2.1 delivered (12 Aug 2026)

- Partner execution rail: instruction → partner confirm → receipt (fundsMoved: false)
- `/app/executions` + receipt detail
- Material accept: step-up `123456` + optional "Send to partner rail"
- Notification preferences (critical always on)
- Monthly wealth report generator
- 28 tests; 59 routes

## Phase 2.2 delivered (12 Aug 2026)

- Privacy Centre: JSON export (no password hashes) + access/erasure/rectification/objection requests
- Admin privacy queue
- Life Events lite (+ governed memory)
- Cash-flow intelligence engine + `/app/cashflow`
- Skip-to-content a11y link
- 31 tests; 67 routes

## Phase 2.3 delivered (12 Aug 2026)

Production hardening:

- Rate limiting on sign-in, AI chat, WealthGuard, documents (`src/lib/rate-limit.ts`)
- Feature flags (`FF_*` env + `/admin/flags`) gating WealthGuard, monthly reports, partner execution, household, LLM polish
- Document storage to `.data/docs` with checksum + demo encryption envelope
- Privacy erasure workflow: anonymise customer on completed erasure; erased users cannot sign in
- Household lite (`/app/household`) — flag-gated
- PWA manifest + layout metadata
- Partner execution errors surfaced when flag is off

36 tests green; 70 routes build clean.

## Phase 3.0 delivered (12 Aug 2026)

Nigeria-first balance-sheet depth:

- Property intelligence engine + `/app/property` (equity, LTV, yield, concentration, stale valuations)
- Business intelligence engine + `/app/business` (ownership-adjusted equity, facilities, income dependency)
- Insurance inventory engine + `/app/insurance` (cover inventory + gap signals; **no underwriting**)
- WealthAI intents: property equity / business / insurance grounded in the same engines
- Feature flags: `FF_PROPERTY_INTEL`, `FF_BUSINESS_INTEL`, `FF_INSURANCE_INTEL`
- WCAG hardening: `prefers-reduced-motion`, existing skip-link + focus-visible retained
- Postgres migration path documented in README (provider swap + migrate/deploy)

42 tests green; 73 routes build clean.

## Phase 3.1 delivered (12 Aug 2026)

Open banking + pension + a11y:

- Open-banking demo adapter (`src/integrations/open-banking.ts`) with consent-gated sync
- Connections UI: connect demo banks, sync, disconnect (pauses consent); refreshes matching cash assets when healthy
- APIs: `/api/connections`, `/api/connections/[id]` (rate-limited)
- Pension aggregation engine + `/app/pension` (RSA vs foreign, illustrative funding gap)
- WealthAI pension intent grounded in the pension engine
- Flag: `FF_PENSION_INTEL`
- WCAG hardening: Field `aria-describedby` / `aria-invalid`, stronger muted contrast, live regions on connections, reduced-motion retained

48 tests green; 75 routes build clean.

## Phase 3.2 delivered (12 Aug 2026)

Wealth Inbox + life-event automation + estate lite:

- `InboxItem` model + `/app/inbox` — synthesises recommendations, connection issues, stale data, escalations, estate gaps
- Life-event automation engine — checklists + inbox drafts on event create (no auto-execution)
- Estate / will lite engine + `/app/estate` inventory (will, POA, beneficiaries, succession)
- Home unread badge; flags `FF_WEALTH_INBOX`, `FF_LIFE_EVENT_AUTO`, `FF_ESTATE_LITE`
- Privacy erasure clears inbox + estate items

52 tests green; 79 routes build clean. Reseed (`npm run db:setup`) to load estate demo rows.

## Phase 3.3 delivered (12 Aug 2026)

Adviser collaboration + tax lite + performance budgets:

- `AdviserNote` model — notes / plan actions / call summaries; optional customer share → inbox + notification
- Adviser customer 360: notes panel + collaboration timeline
- Customer `/app/adviser-collab` shared notes + timeline
- Tax lite engine + `/app/tax` (illustrative PIT / WHT awareness — not filing)
- WealthAI tax intent grounded in tax lite
- `perf-budget.json` + `npm run perf:check` post-build guardrails; app `loading.tsx` skeleton
- Flags: `FF_ADVISER_COLLAB`, `FF_TAX_LITE`

54 tests green; 83 routes build clean; `npm run perf:check` OK.
Reseed (`npm run db:setup`) for shared adviser note demos.

## Phase 4.0 delivered (13 Aug 2026)

Boundary clarity + production path:

- Crypto lite engine + `/app/crypto` — inventory + concentration; **defers** trading/prices/execution
- Lending awareness engine + `/app/lending` — debt service ratio / high-cost debt; **no** loan marketplace
- `CRYPTO` asset category; add-wealth supports crypto (awareness only)
- WealthAI crypto / lending intents with deferral messaging
- `POSTGRES_CUTOVER.md` production checklist + `npm run db:postgres-ready`
- Flags: `FF_CRYPTO_LITE`, `FF_LENDING_LITE`

57 tests green; 85 routes build clean; `npm run db:postgres-ready` OK.

## Phase 4.1 delivered (13 Aug 2026)

Launch freeze package:

- `OPS_RUNBOOK.md` — release, incident, support triage
- `LAUNCH_REVIEW.md` — go/no-go freeze checklist
- `DEMO_SCRIPT.md` + `/demo` presenter checklist
- `GET /api/health` — DB + launch blockers for probes
- `/admin/ops` — launch gate UI + doc/command index
- `npm run launch:check` (+ `LAUNCH_PROFILE=production` for hard blockers)
- Launch-gate unit tests

59 tests green; 87 routes build clean; `npm run launch:check` OK (development profile).

## Phase 4.2 delivered (13 Aug 2026)

Postgres migrate scaffolding (post-freeze):

- `prisma/migrations-postgres/20260813000000_init/migration.sql` — full Postgres DDL
- `prisma/schema.postgresql.prisma` — provider mirror
- `docker-compose.yml` — local Postgres 16
- `.env.postgres.example`
- Scripts: `db:use-postgres`, `db:use-sqlite`, `db:gen-pg-migration`, `db:sync-pg-schema`, `db:up` / `db:down`
- Migration package unit test + strengthened `db:postgres-ready`

Local SQLite MVP unchanged; Postgres migrations activate only via `db:use-postgres`.

61 tests green; 87 routes build clean; `npm run db:postgres-ready` OK.

## Phase 4.3 delivered (13 Aug 2026)

Release package + Postgres rehearsal tooling:

- `CHANGELOG.md`, `VERSION` (0.1.0)
- `npm run release:check` — launch + postgres-ready + perf (when `.next` exists)
- `npm run db:rehearse-postgres` — compose → migrate deploy → seed → restore SQLite
- Live Docker rehearsal **blocked in this environment**: Docker CLI present, Desktop daemon not running (`dockerDesktopLinuxEngine` pipe missing). Start Docker Desktop, then run `npm run db:rehearse-postgres`.
- `npm run release:check` green on this machine (launch + postgres-ready + perf)

62 tests green; SQLite provider restored.

## Phase 4.4 delivered (13 Aug 2026)

MVP freeze close-out:

- `MVP_STATUS.md` — module readiness + gate checklist
- `npm run smoke` — HTTP journeys (public pages, health, Yomi sign-in + app shells)
- Freeze inventory tests (routes, engines, personas, docs)
- Docker rehearsal still requires starting Docker Desktop

65 tests green.

### Postgres rehearsal result (13 Aug 2026)

`npm run db:rehearse-postgres` **SUCCEEDED** after:
- Host port remapped to **5434** (5432 taken by medimind-postgres)
- UTF-8 BOM stripped from `migration_lock.toml` / `migration.sql`

Migrate `20260813000000_init` applied; demo seed completed; SQLite MVP provider restored. Container `wealthos-postgres` left running (`npm run db:down` to stop).

## Phase 5.0 delivered (13 Aug 2026)

Pilot / CI package after GitHub publish:

- Remote: `https://github.com/yomibernard/WealthOS.git` (`main`)
- `.github/workflows/ci.yml` — npm ci → db:setup → test → build → release:check
- `.env.example` — documented local + pilot env surface
- `DEPLOY.md` — Vercel/Postgres and Compose deploy path; tagging notes
- `MVP_STATUS.md` updated (Postgres rehearsal + CI marked done)

### Phase 5.1 delivered (13 Aug 2026)

- `vercel.json` → `npm run build:vercel` (`scripts/vercel-build.mjs`)
- Build path: activate Postgres schema/migrations → `migrate deploy` → `next build`
- Fails closed on SQLite `file:` URLs
- Annotated release tag `v0.1.0`

Next human gates: create hosted Postgres, set Vercel env secrets, deploy smoke, `LAUNCH_REVIEW.md` sign-off.

## Phase 6.0 delivered (13 Aug 2026)

Monthly report centre (independent of hosting):

- `/app/reports` + `/app/reports/[id]` — generate, history with deltas, full sectioned report
- API GET/POST `/api/reports/monthly`, GET `/api/reports/monthly/[id]`
- Richer snapshot payload; home + More entry points
- Flag: `FF_MONTHLY_REPORTS` (existing)

## Phase 6.1 delivered (13 Aug 2026)

Report intelligence layer:

- `report-insights` engine — MoM net worth / health / confidence narratives
- Sparkline on report list + detail; print CSS + Print/save PDF control
- Inbox draft on generate; WealthAI monthly report intent

## Phase 6.2 delivered (13 Aug 2026)

Data confidence remediation:

- `data-quality` engine ranks stale / estimated / low-confidence holdings
- `/app/wealth/confidence` remediation queue with confirm or update value
- `POST /api/wealth/refresh`; Home CTA when confidence low or stale assets exist
- WealthAI `data_quality` intent

## Phase 6.3 delivered (13 Aug 2026)

Goal funding pulse:

- `goal-funding` engine ranks ahead / on track / behind / critical
- `/app/plan/funding` with apply suggested or custom monthly contribution
- API `POST /api/goals/[id]/funding`; WealthAI `goal_funding` intent

## Phase 6.4 delivered (13 Aug 2026)

Weekly wealth digest:

- `weekly-digest` engine composes calm sections from live wealth state
- `/app/digest` + generate → notification + snapshot; flag `FF_WEEKLY_DIGEST`
- WealthAI `weekly_digest` intent

## Phase 7.0 delivered (13 Aug 2026)

Adviser insights pack:

- `adviser-insights` engine → briefing, prioritised talking points, do-not-say guardrails
- Rendered on `/adviser/customers/[id]`; API `GET /api/adviser/insights/[customerId]`
- Reuses data quality, funding pulse, weekly digest, escalations, and attention items

## Phase 7.1 delivered (13 Aug 2026)

Profile completeness:

- Weighted checklist engine (risk, cashflow, graph, goals, consent, household)
- `/app/profile` with Fix / Continue next gap; `syncProfileCompleteness` persists score
- Home CTA when score < 80%; WealthAI `profile_completeness` intent

## Phase 7.2 delivered (13 Aug 2026)

Share with adviser:

- `adviser-share` pack builder + `sharePackWithAdviser` service
- Customer UI on `/app/digest`, `/app/profile`, `/app/adviser-collab`
- Creates `customer_share` note, notifies adviser + customer, audits share

## Phase 7.3 delivered (13 Aug 2026)

Adviser nudges:

- `adviser-nudge` templates with deep links into customer remediation flows
- Adviser 360 panel + `POST /api/adviser/nudge`
- Shared note + inbox item + audit (`ADVISER_NUDGE_SENT`)

## Phase 7.4 delivered (13 Aug 2026)

Notification preferences:

- `notification-prefs` policy + `createUserNotification` (suppress by channel; critical always on)
- Wired into reports, digests, adviser share/notes, funding updates
- `/app/notifications` channel cards + generate monthly/weekly actions

## Phase 8.0 delivered (13 Aug 2026)

Demo & ops sync:

- `DEMO_SCRIPT.md` expanded to ~20–25 min with cadence tools + adviser share/nudge loop
- `/demo` presenter checklist updated; `/admin/ops` lists cadence/collab modules + `DEPLOY.md`

## Phase 8.1 delivered (13 Aug 2026)

Privacy & support polish:

- `exportCustomerData` portability pack now includes cadence snapshots, shares/nudges, prefs, inbox, privacy requests
- `/app/support` L2 support/complaint intake + case history; admin escalations show complaint badges
- `GET /api/escalations` for the customer’s own cases

## Phase 8.2 delivered (13 Aug 2026)

Hosted pilot smoke:

- `npm run smoke:hosted` against `SMOKE_BASE_URL` (Postgres + DB probe required; DEMO_MODE warn)
- `/api/health` exposes non-secret `config.demoMode` / `config.databaseKind`
- Admin ops post-deploy checklist; LAUNCH_REVIEW / DEPLOY.md updated

## Phase 8.3 delivered (13 Aug 2026)

Escalation ops loop:

- Admin `/admin/escalations` resolve/reject with notes; `ESCALATION_UPDATED` audit
- Customer notification + resolution visible on `/app/support`

## Phase 8.4 delivered (13 Aug 2026)

Daily ops board:

- Attention-scored queues on `/admin/ops` + summary strip on `/admin`
- `GET /api/admin/ops-daily`; demo Act 5 + OPS_RUNBOOK on-call start at the board

## Phase 8.5 delivered (13 Aug 2026)

Audit export:

- Filterable `/admin/audit` by category / event type / search
- Redacted JSON download via `GET /api/admin/audit?download=1`; `AUDIT_EXPORT_DOWNLOADED`

## Phase 8.6 delivered (13 Aug 2026)

Flag profiles:

- `/admin/flags` compares env to full demo / safe pilot / incident lockdown with copy-paste snippets
- Ops daily board includes high-risk flag attention; `GET /api/admin/flags`

## Phase 8.7 delivered (13 Aug 2026)

Pilot freeze pack **v0.1.1**:

- `npm run pilot:freeze` — versions, 8.x scripts/docs, smoke + safe-pilot guidance
- Changelog rolled; LAUNCH_REVIEW / MVP_STATUS / demo Act 5 updated

## Phase 9.0 delivered (13 Aug 2026)

Customer case awareness:

- Home pulse for open complaints/support + recent resolutions → `/app/support`
- WealthAI intents `support_case` / `privacy` with ComplianceAI routing

## Phase 9.1 delivered (13 Aug 2026)

Case inbox loop:

- Create/resolve escalations write Wealth Inbox cards deep-linked to `/app/support`
- `refreshInbox` covers open + in_progress; complaint titles; closes stale open cards on resolve

## Phase 9.2 delivered (13 Aug 2026)

Privacy request loop:

- Home pulse for open/recent privacy requests; Inbox deep-links to `/app/privacy`
- Create + admin update notify via prefs; erasure completion skips customer inbox resurface

## Phase 9.3 delivered (13 Aug 2026)

Notification deep-links + demo sync:

- `resolveNotificationLink` on `/app/notifications` (title/body/Path heuristics)
- DEMO_SCRIPT / `/demo` Act 5 covers support + privacy trust loops

## Phase 9.4 delivered (13 Aug 2026)

Trust loop freeze pack **v0.1.2**:

- `npm run pilot:freeze` checks 9.x engines/pages + Trust/Privacy demo loops
- Changelog rolled; VERSION / LAUNCH_REVIEW / MVP_STATUS aligned

## Phase 10.0 delivered (13 Aug 2026)

Adviser care desk:

- Customer 360 panel lists open support/complaints and privacy requests
- Insights pack prioritises complaint + privacy talking points

## Phase 10.1 delivered (13 Aug 2026)

Portfolio care radar:

- `/adviser` lists customers ranked by care load with complaint/privacy badges
- Summary strip for the book; deep-link into each Care desk

## Phase 10.2 delivered (13 Aug 2026)

Care acknowledgments:

- Advisers send calm care updates from 360; Inbox/notification deep-links to support or privacy
- Ops queues remain authoritative for formal resolution

## Phase 10.3 delivered (13 Aug 2026)

Adviser care freeze pack **v0.1.3**:

- `npm run pilot:freeze` checks 10.x engines/pages + Care radar / Care desk demo cues
- Changelog rolled; VERSION / LAUNCH_REVIEW / MVP_STATUS aligned

## Phase 11.0 delivered (13 Aug 2026)

Portfolio care filters:

- `/adviser?care=` slices the book (needs care / complaints / privacy / support)
- Book badges keep full totals; list + summary reflect the active filter

## Phase 11.1 delivered (13 Aug 2026)

Care acknowledgment history:

- Customer 360 Care desk shows recent shared care acks so advisers avoid blind re-acks
- Pure history builder over `care_ack` notes; ops queues still authoritative

## Phase 11.2 delivered (13 Aug 2026)

Portfolio last-ack cues:

- `/adviser` rows show ack age (`No care ack yet` / `Acked 3d ago`)
- `?care=unacked` filter + book badge for first-acknowledgment gaps

## Phase 11.3 delivered (13 Aug 2026)

Adviser care UX freeze pack **v0.1.4**:

- `npm run pilot:freeze` checks 11.x filters, unacked cues, and care history surface
- Changelog rolled; VERSION / LAUNCH_REVIEW / MVP_STATUS aligned

## Phase 12.0 delivered (13 Aug 2026)

Ops care handoff:

- Daily ops board queue for customers with open care and no care acknowledgment
- Recent adviser acks listed on `/admin/ops`; deep-link to unacked care radar

## Phase 12.1 delivered (13 Aug 2026)

Escalation care-ack cues:

- `/admin/escalations` badges Care acked / No care ack per case
- Deep-link to customer Care desk for adviser follow-up

## Phase 12.2 delivered (13 Aug 2026)

Privacy care-ack cues:

- `/admin/privacy` shows customer identity + Care acked / No care ack
- Care desk deep-link mirrors escalations queue

## Phase 12.3 delivered (13 Aug 2026)

Ops care handoff freeze pack **v0.1.5**:

- `npm run pilot:freeze` checks 12.x handoff + escalation/privacy care cues
- Changelog rolled; VERSION / LAUNCH_REVIEW / MVP_STATUS aligned

## Phase 13.0 delivered (13 Aug 2026)

Customer care-update pulse:

- Home CTA when a shared care acknowledgment arrived in the last 14 days
- Deep-links to Support or Privacy Centre from the latest ack topic

## Phase 13.1 delivered (13 Aug 2026)

Support care updates:

- `/app/support` shows recent adviser care acknowledgments
- `GET /api/care-updates` powers Home + Support from the same pulse builder

## Phase 13.2 delivered (13 Aug 2026)

Privacy care updates + smoke:

- `/app/privacy` shows privacy-related care acknowledgments
- Local/hosted smoke checks support, privacy, and `/api/care-updates`

## Phase 13.3 delivered (13 Aug 2026)

Customer care loop freeze pack **v0.1.6**:

- `npm run pilot:freeze` checks Home/Support/Privacy care updates + care-updates API/smoke
- Changelog rolled; VERSION / LAUNCH_REVIEW / MVP_STATUS aligned

## Phase 14.0 delivered (13 Aug 2026)

WealthAI care-update intent:

- Classifies adviser acknowledgment / care update questions
- ComplianceAI response points to Home, Support, and Privacy without claiming ops closure

## Phase 14.1 delivered (13 Aug 2026)

Grounded care-update answers:

- CustomerContext loads care-update pulse for WealthAI
- Responses cite recent ack headline/path when present; otherwise guide to Inbox/Care desk

## Phase 14.2 delivered (13 Aug 2026)

WealthAI care smoke + demo:

- Local smoke POSTs a care_update question to `/api/ai/chat`; hosted smoke hits `/app/ai`
- Demo Act 5 includes the WealthAI care-update prompt

## Phase 14.3 delivered (13 Aug 2026)

WealthAI care freeze pack **v0.1.7**:

- `npm run pilot:freeze` checks WealthAI `care_update` intent, grounded pulse, `/app/ai` smoke
- Changelog rolled; VERSION / LAUNCH_REVIEW / MVP_STATUS aligned

## Phase 15.0 delivered (13 Aug 2026)

Care receipts (customer mark-as-seen):

- Support/Privacy mark care updates seen with optional thanks; related Inbox care_ack → acted
- Home / default `GET /api/care-updates` pulse is unseen-only; `?list=1` includes seen history
- Adviser 360 Care desk shows Seen/Unseen + thanks; WealthAI copy mentions mark-as-seen
- Local smoke probes list + mark-seen when an unseen ack exists

## Phase 15.1 delivered (13 Aug 2026)

Care receipt smoke + seed:

- Seed includes a shared Yomi `care_ack` + Inbox/notification so Home pulse and mark-as-seen work after `db:setup`
- Hosted smoke covers `/api/care-updates?list=1`; local smoke asserts `/seen` path

## Phase 15.2 delivered (13 Aug 2026)

Care receipts freeze pack **v0.1.8**:

- `npm run pilot:freeze` checks mark-as-seen API/UI, unseen pulse, seed care_ack, list/seen smoke
- Changelog rolled; VERSION / LAUNCH_REVIEW / MVP_STATUS aligned

## Phase 16.0 delivered (13 Aug 2026)

Care receipt close-loop:

- Mark-as-seen notifies the sending adviser (Important) with Care desk deep-link
- `/admin/ops` care handoff shows awaiting-receipt count + recent customer receipts
- `/adviser?care=awaiting` filters customers with unseen shared care acks
- Seed includes Amaka seen receipt for ops demo; Yomi remains unseen for mark-as-seen

## Phase 16.1 delivered (13 Aug 2026)

Care receipt close-loop smoke:

- Local smoke signs in adviser/admin and hits `/adviser?care=awaiting` + `/admin/ops`
- Hosted smoke covers the same close-loop paths when seed users exist

## Phase 16.2 delivered (13 Aug 2026)

Care receipt close-loop freeze pack **v0.1.9**:

- `npm run pilot:freeze` checks adviser notify, awaiting radar, ops receipts, close-loop smoke
- Changelog rolled; VERSION / LAUNCH_REVIEW / MVP_STATUS aligned

## Phase 17.0 delivered (13 Aug 2026)

Adviser notification centre:

- `/adviser/notifications` lists care receipts / shares with mark-as-read and Care desk links
- Adviser portal unread pulse; seed leaves Ada an unread Amaka receipt notify
- Share notifies include `Path: /adviser/customers/{id}`; smoke hits the new route

## Phase 17.1 delivered (13 Aug 2026)

Adviser notification smoke:

- Local smoke GETs `/api/notifications` as adviser and PATCHes mark-as-read when unread exists
- Hosted smoke includes `/api/notifications` on the adviser path set

## Phase 17.2 delivered (14 Aug 2026)

Adviser notification centre freeze pack **v0.1.10**:

- `npm run pilot:freeze` checks `/adviser/notifications`, mark-as-read API, unread pulse, seed + smoke
- Changelog rolled; VERSION / LAUNCH_REVIEW / MVP_STATUS aligned

## Phase 18.0 delivered (14 Aug 2026)

Adviser notification triage:

- Unread / All + Care receipts / Shares chips on `/adviser/notifications`
- `POST /api/notifications/mark-all-read`; unread pulse deep-links to `?read=unread`
- Seed leaves Ada an unread care receipt and an unread Yomi share for demo filters

## Phase 18.1 delivered (14 Aug 2026)

Adviser notification triage smoke:

- Local smoke hits `?read=unread` / kind filters and `POST /api/notifications/mark-all-read`
- Hosted smoke includes unread + care-receipt triage paths

## Phase 18.2 delivered (14 Aug 2026)

Adviser notification triage freeze pack **v0.1.11**:

- `npm run pilot:freeze` checks triage helpers, mark-all-read API/UI, seed share, smoke filters
- Changelog rolled; VERSION / LAUNCH_REVIEW / MVP_STATUS aligned

## Phase 19.0 delivered (14 Aug 2026)

Customer notification triage:

- `/app/notifications` Unread/All + Care/Support/Privacy/Cadence chips, mark-as-read / mark-all-read
- Home unread notifications pulse → `?read=unread`; seed mixes care + cadence + read history
- Local smoke hits customer notification triage paths + mark-read

## Phase 19.1 delivered (14 Aug 2026)

Customer notification triage smoke:

- Local smoke POSTs customer `mark-all-read` after single mark-read
- Hosted smoke includes `kind=care_update` and `kind=cadence` triage paths

## Phase 19.2 delivered (14 Aug 2026)

Customer notification triage freeze pack **v0.1.12**:

- `npm run pilot:freeze` checks customer triage engine, Home pulse, mark-all-read UI, seed cadence, smoke
- Changelog rolled; VERSION / LAUNCH_REVIEW / MVP_STATUS aligned

## Phase 20.0 delivered (14 Aug 2026)

Wealth Inbox triage:

- `/app/inbox` Unread/All + kind chips (Recommendations, Connections, Adviser, …) + mark-all-read
- Home Wealth Inbox badge deep-links to `?status=unread` when unread
- Local/hosted smoke hits inbox triage paths + mark-read / mark-all-read

## Phase 20.1 delivered (14 Aug 2026)

Wealth Inbox triage smoke:

- Local smoke hits connection/data_quality kind filters; mark-all-read labeled `(inbox)`
- Hosted smoke includes `kind=recommendation` and `kind=adviser`

## Phase 20.2 delivered (14 Aug 2026)

Wealth Inbox triage freeze pack **v0.1.13**:

- `npm run pilot:freeze` checks inbox triage engine, mark-all-read API/UI, Home unread link, smoke
- Changelog rolled; VERSION / LAUNCH_REVIEW / MVP_STATUS aligned

## Phase 21.0 delivered (14 Aug 2026)

Home next-steps pulse:

- Ranked deep-linked next steps on Home (care → support/privacy → data quality → profile → actions)
- `GET /api/next-steps`; WealthAI actions intent uses the same pulse when available
- Smoke hits `/api/next-steps`

## Phase 21.1 delivered (14 Aug 2026)

Home next-steps smoke:

- Local smoke checks next-steps `primaryHref` / item hrefs
- WealthAI probe: “What should I do next?” must cite an in-app path or next-steps copy

## Phase 21.2 delivered (14 Aug 2026)

Home next-steps pulse freeze pack **v0.1.14**:

- `npm run pilot:freeze` checks next-steps engine/service/API, Home UI, AI grounding, smoke
- Changelog rolled; VERSION / LAUNCH_REVIEW / MVP_STATUS aligned

## Phase 22.0 delivered (14 Aug 2026)

Adviser book next-steps:

- Ranked “Needs your attention” on `/adviser` (complaints → privacy → unacked → awaiting → support → notifications)
- `GET /api/adviser/next-steps`; Care desk / `?care=` deep links
- Smoke hits adviser next-steps API

## Phase 22.1 delivered (14 Aug 2026)

Adviser book next-steps smoke:

- Local smoke checks first item `kind` + adviser-scoped `href` / `primaryHref`
- Hosted smoke includes `/api/adviser/next-steps`

## Phase 22.2 delivered (14 Aug 2026)

Adviser book next-steps freeze pack **v0.1.15**:

- `npm run pilot:freeze` checks adviser next-steps engine/service/API, portal UI, smoke
- Changelog rolled; VERSION / LAUNCH_REVIEW / MVP_STATUS aligned

## Phase 23.0 delivered (14 Aug 2026)

Adviser WealthAI book next-steps:

- `/adviser/ai` + `POST /api/adviser/ai` — “What should I do next for my book?” grounded on Care radar pulse
- Paths stay under `/adviser…`; ops queues remain authoritative
- Smoke asserts adviser AI reply cites book next-steps / adviser paths

## Phase 23.1 delivered (14 Aug 2026)

Adviser WealthAI book next-steps smoke:

- Local smoke requires CoachAI, `adviserNextStepsPulse`, and `Path: /adviser`
- Hosted smoke POSTs `/api/adviser/ai` book next-steps probe

## Phase 23.2 delivered (14 Aug 2026)

Adviser WealthAI book next-steps freeze pack **v0.1.16**:

- `npm run pilot:freeze` checks adviser WealthAI engine helpers, `/adviser/ai`, API grounding, smoke
- Changelog rolled; VERSION / LAUNCH_REVIEW / MVP_STATUS aligned

## Phase 24.0 delivered (14 Aug 2026)

Admin/ops next-steps pulse:

- Ranked “Needs your attention” on `/admin` + `/admin/ops` (complaints → escalations → privacy → launch → care handoff → maker-checker → flags)
- `GET /api/admin/next-steps`; wraps ops-daily counts without inventing case detail
- Smoke hits admin next-steps API

## Phase 24.1 delivered (14 Aug 2026)

Admin/ops next-steps smoke:

- Local smoke checks first item `kind` + admin/adviser-scoped `href` / `primaryHref`
- Fixed missing brace in `smoke-journeys.mjs` admin block

## Phase 24.2 delivered (14 Aug 2026)

Admin/ops next-steps freeze pack **v0.1.17**:

- `npm run pilot:freeze` checks ops next-steps engine/service/API, admin UI, smoke
- Changelog rolled; VERSION / LAUNCH_REVIEW / MVP_STATUS aligned

## Phase 25.0 delivered (14 Aug 2026)

Admin WealthAI ops next-steps:

- `/admin/ai` + `POST /api/admin/ai` — “What should I do next for ops?” grounded on daily board pulse
- Paths stay under `/admin…` (or Care radar handoffs); queues remain authoritative
- Smoke asserts admin AI reply cites ops next-steps / admin paths

## Phase 25.1 delivered (14 Aug 2026)

Admin WealthAI ops next-steps smoke:

- Local smoke requires CoachAI, `opsNextStepsPulse`, and `Path: /admin` or `/adviser`
- Hosted smoke POSTs `/api/admin/ai` ops next-steps probe

## Phase 25.2 delivered (14 Aug 2026)

Admin WealthAI ops next-steps freeze pack **v0.1.18**:

- `npm run pilot:freeze` checks admin WealthAI engine helpers, `/admin/ai`, API grounding, smoke
- Changelog rolled; VERSION / LAUNCH_REVIEW / MVP_STATUS aligned

## Phase 26.0 delivered (14 Aug 2026)

Ops care remind:

- `/admin/ops` Care handoff CTA reminds linked advisers for unacked customers
- `POST /api/admin/care-remind`; adviser notifications classify as **Care handoff**
- Reminders never close escalation or privacy queues; audit `OPS_CARE_REMIND`

## Phase 26.1 delivered (14 Aug 2026)

Ops care remind smoke:

- Local smoke asserts queues-stay-open note + adviser Care handoff notification after remind
- Hosted smoke POSTs `/api/admin/care-remind`

## Phase 26.2 delivered (14 Aug 2026)

Ops care remind freeze pack **v0.1.19**:

- `npm run pilot:freeze` checks ops care remind engine/service/API, admin CTA, Care handoff kind, smoke
- Changelog rolled; VERSION / LAUNCH_REVIEW / MVP_STATUS aligned

## Phase 27.0 delivered (14 Aug 2026)

Ops queue care remind:

- Per-customer **Remind adviser** on `/admin/escalations` + `/admin/privacy` when **No care ack**
- Reuses `POST /api/admin/care-remind` with `customerId`; queues stay open
- Ops next-steps care handoff points at escalations + Remind copy

## Phase 27.1 delivered (14 Aug 2026)

Ops care remind trail + smoke:

- Care handoff shows **Recent ops reminds** from `OPS_CARE_REMIND` audit
- Local/hosted smoke assert trail after remind; queue care_handoff tile → escalations

## Phase 27.2 delivered (14 Aug 2026)

Ops queue care remind freeze pack **v0.1.20**:

- `npm run pilot:freeze` checks per-queue Remind, recent reminds trail, smoke, DEMO
- Changelog rolled; VERSION / LAUNCH_REVIEW / MVP_STATUS aligned

## Phase 28.0 delivered (15 Aug 2026)

Adviser ops-remind cues:

- Care radar `?care=ops_reminded` + **Ops reminded** badge/cue while still unacked
- Care desk durable banner from `OPS_CARE_REMIND` audit
- Book next-steps elevates ops-reminded unacked customers

## Phase 28.1 delivered (15 Aug 2026)

Adviser ops-remind smoke:

- Local smoke asserts Ops reminded radar cue, Care desk banner, next-steps `ops_reminded` kind
- Hosted smoke probes adviser ops_reminded radar + next-steps after care-remind

## Phase 28.2 delivered (15 Aug 2026)

Adviser ops-remind cues freeze pack **v0.1.21**:

- `npm run pilot:freeze` checks Ops reminded radar/desk/next-steps, smoke, DEMO
- Changelog rolled; VERSION / LAUNCH_REVIEW / MVP_STATUS aligned

## Phase 29.0 delivered (15 Aug 2026)

Ops remind-answer close-loop:

- Care ack after `OPS_CARE_REMIND` records `OPS_REMIND_ANSWERED` + admin notify
- Care handoff shows **Recent remind answers**; queues stay open

## Phase 29.1 delivered (17 Aug 2026)

Ops remind-answer smoke:

- Local/hosted: seed unacked Chioma case → care-remind → care-ack `answeredOpsRemind`
- Asserts `recentRemindAnswers` trail + admin **Remind answered** notification

## Phase 29.2 delivered (17 Aug 2026)

Ops remind-answer close-loop freeze pack **v0.1.22**:

- `npm run pilot:freeze` checks remind-answer helpers, Care handoff trail, smoke, DEMO
- Changelog rolled; VERSION / LAUNCH_REVIEW / MVP_STATUS aligned

## Phase 30.1 delivered (17 Aug 2026)

Prod launch-gate rehearsal:

- Shared `scripts/lib/launch-evaluate.mjs` for CLI parity with `src/lib/launch-gate.ts`
- `npm run launch:rehearse-prod` proves fail-closed + hardened Postgres fixture without reading real secrets

## Phase 30.2 delivered (17 Aug 2026)

Engineering LAUNCH_REVIEW evidence gate:

- `npm run launch:review` asserts suitability, WealthGuard, NBFA do-nothing, consent, step-up, deferrals, escalations resolve path
- Wired into `npm run release:check`; legal counsel / staffing remain human

## Phase 30.3 delivered (17 Aug 2026)

Hosted smoke / deploy readiness:

- `npm run smoke:hosted-ready` preflight + DEPLOY readiness checklist
- Admin ops + DEMO mention launch rehearsal / hosted-ready commands

## Phase 30.4 delivered (17 Aug 2026)

Launch readiness freeze pack **v0.1.23**:

- `npm run pilot:freeze` checks rehearsal, review evidence, hosted-ready, DEPLOY/DEMO/ops beats
- Changelog rolled; VERSION / LAUNCH_REVIEW / MVP_STATUS aligned

## Phase 31.0 delivered (17 Aug 2026)

Secrets hygiene gate:

- `npm run secrets:check` — `.env` not tracked, `.env.example` present, no private keys / live API keys in git
- Wired into `npm run release:check`; LAUNCH_REVIEW “No secrets in git” engineering-verified
