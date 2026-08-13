# WealthOS operations runbook

## 1. Release

1. Confirm release commit is green: `npm run test && npm run build && npm run perf:check`
2. If targeting Postgres prod: `npm run db:postgres-ready` and complete [POSTGRES_CUTOVER.md](./POSTGRES_CUTOVER.md)
3. Confirm launch gate: `npm run launch:check`
4. Deploy app artifact; run `npx prisma migrate deploy` on prod DB before switching traffic
5. Smoke: `/api/health`, sign-in, Wealth Check, AI chat (consent on), Privacy export
6. Record release version in ops notes / change log

Never run `npm run db:setup` in production (wipes and reseeds).

## 2. Incident response

| Severity | Examples | First actions |
|----------|----------|----------------|
| SEV-1 | Auth down, data leak, wrong balances widely | Disable public traffic; apply **incident lockdown** profile on `/admin/flags`; rotate `SESSION_SECRET` if session theft suspected |
| SEV-2 | WealthAI inventing numbers, partner rail errors | Apply lockdown / set `FF_LLM_POLISH=false`, `FF_PARTNER_EXECUTION=false`; check `/admin/monitoring` |
| SEV-3 | Single-user sync/consent bug | Reproduce with demo persona; open escalation; fix forward |

### Feature flag profiles

1. Open `/admin/flags` — compare current env to **full demo**, **safe pilot**, **incident lockdown**
2. Copy the profile env snippet into Vercel/host → redeploy (flags are not toggled in-app)
3. Shared pilot URLs should match **safe pilot** (partner + LLM polish off)
4. Daily ops board warns when high-risk flags remain on

### AI / suitability

1. Capture conversation id and audit events (`/admin/audit` — filter `ai`, Download JSON)
2. Confirm ComplianceAI still blocks prompt-injection / suitability bypass
3. Prefer deterministic engines only until LLM polish is re-approved

### Audit export

1. Open `/admin/audit`, filter by category (privacy / escalation / consent / cadence…)
2. Download JSON — payloads redact password/secret/token fields
3. Each download writes `AUDIT_EXPORT_DOWNLOADED` for chain-of-custody

### Open-banking demo rail

1. Confirm consent is ACTIVE for the connection
2. Sync from `/app/connections`; degraded ARM-style providers are expected in demo
3. Force-down test: `OPEN_BANKING_FORCE_DOWN=true` (staging only)

### Privacy / erasure

1. Queue lives at `/admin/privacy`
2. Erasure anonymises the customer and blocks sign-in — irreversible for that identity
3. Keep audit events per compliance policy

## 3. Support triage

| Customer ask | Route |
|--------------|--------|
| Balances look wrong | Wealth confidence + connections sync; check stale valuations |
| Want to invest / buy product | Suitability + `/app/actions` + adviser if material |
| Scam / WhatsApp offer | `/app/wealthguard` — never auto-label guaranteed |
| Want human help | `/app/adviser-request` (L3) |
| Support / formal complaint | `/app/support` (L2) → resolve in `/admin/escalations` |
| Delete my data | Privacy Centre erasure request |
| Crypto trade / loan offer | Explain deferred capabilities; do not invent products |

### Escalation / complaint resolution

1. Queue: `/admin/escalations` (open + in-progress first)
2. Add a resolution note → **In progress** / **Resolve** / **Reject**
3. Customer is notified in-product; they see the update on `/app/support`
4. Complaints are prefixed `COMPLAINT:` — keep resolution factual; no fund movement from this queue

Step-up demo code for material accepts: `123456` (demo only).

## 4. On-call checklist (daily)

Start at **`/admin/ops`** (daily ops board) or the summary strip on `/admin`.

- [ ] `/api/health` returns `ok` (`databaseKind: postgres` on hosted)
- [ ] Attention score / open complaints cleared (`/admin/escalations`)
- [ ] Maker-checker queue not stuck (`/admin/change-requests`)
- [ ] Privacy queue SLA (`/admin/privacy`)
- [ ] Feature flags match intended prod profile (`/admin/flags`)
- [ ] Launch gate blockers understood for the current profile
