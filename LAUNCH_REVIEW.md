# WealthOS launch review freeze checklist

Use this before any public or regulated pilot. Tick in order; freeze code when section A passes.

Engineering evidence for many section B product rules is also covered by `npm run launch:review` (wired into `npm run release:check`). That gate does **not** replace legal counsel or ops staffing sign-off.

## A. Freeze gate (engineering)

- [ ] `npm run test` green
- [ ] `npm run build` green
- [ ] `npm run perf:check` green
- [ ] `npm run launch:check` green (prod profile)
- [x] `npm run launch:rehearse-prod` green (fixture fail-closed + pass; still run prod `launch:check` on host env)
- [x] `npm run launch:local-a` green (postgres-ready + rehearse + review + secrets + hosted-ready)
- [ ] `npm run db:postgres-ready` green; `prisma/migrations-postgres` reviewed
- [x] Local Postgres rehearsal done once (`db:rehearse-postgres` / migrate deploy) or waived with owner sign-off
- [x] No secrets in git (`.env` local only; use `.env.example`) — `npm run secrets:check`
- [x] GitHub Actions workflow ships test · build · `release:check` — `npm run ci:check` (owner still confirms latest run green on `main`)
- [ ] Hosted pilot env documented per [DEPLOY.md](./DEPLOY.md)
- [ ] `SMOKE_BASE_URL=https://… npm run smoke:hosted` green (or `SMOKE_SKIP_AUTH=1` if unseeded)
- [ ] `SESSION_SECRET` is not the MVP default
- [ ] `DEMO_MODE` is not `true` in production
- [ ] Partner execution remains non-moving funds unless contracted rail is live
- [ ] Feature flags documented for launch; shared pilot matches **safe pilot** on `/admin/flags`
- [ ] `npm run pilot:freeze` green (0.1.25 Care ops polish pack)

## B. Product / compliance freeze

Code-evidence items below are checked by `npm run launch:review`. Legal counsel and staffing remain human.

- [x] Suitability before return still enforced in code paths (`launch:review`)
- [x] WealthGuard never auto-labels scam/fraud/safe/guaranteed (`launch:review`)
- [x] NBFA can recommend do-nothing (`launch:review`)
- [x] Consent revoke blocks personalised AI (`launch:review`)
- [x] Material actions require step-up (demo code retired or replaced) (`launch:review`)
- [x] Crypto / lending pages show deferral (no trading / no loan offers) (`launch:review`)
- [x] Tax / estate pages show “not advice / not filing / not legal drafting” (`launch:review`)
- [ ] Legal counsel sign-off on disclaimers and data processing notice
- [ ] Complaints / escalation path staffed (L2–L5); ops can resolve in `/admin/escalations` (resolve path exists in code via `launch:review`; staffing is human)

## C. Demo readiness (if pilot includes live walkthrough)

- [ ] Seed personas available or replaced with controlled pilot users
- [ ] Demo script rehearsed (`/demo` or [DEMO_SCRIPT.md](./DEMO_SCRIPT.md))
- [ ] Adviser + admin + checker accounts tested for maker-checker
- [ ] Offline fallback: screenshots of Home, Health, Actions, WealthGuard

## D. Go / no-go

| Vote | Owner | Go? |
|------|-------|-----|
| Engineering | | |
| Product | | |
| Compliance / legal | | |
| Support / ops | | |

**Launch decision:** Go / No-go / Go with flags off: _______________

**Freeze tag / commit:** `v0.1.25` (care ops polish; secrets/CI hygiene `v0.1.24`; launch readiness `v0.1.23`; ops remind-answer close-loop `v0.1.22`; adviser ops-remind cues `v0.1.21`; ops queue care remind `v0.1.20`; ops care remind `v0.1.19`; admin WealthAI ops `v0.1.18`; admin/ops next-steps `v0.1.17`; adviser WealthAI book `v0.1.16`; book next-steps `v0.1.15`; Home next-steps `v0.1.14`; inbox triage `v0.1.13`; customer notify triage `v0.1.12`; adviser triage `v0.1.11`; notifications `v0.1.10`; close-loop `v0.1.9`; care receipts `v0.1.8`; WealthAI care `v0.1.7`; customer care `v0.1.6`; ops care `v0.1.5`; care UX `v0.1.4`; care `v0.1.3`; trust `v0.1.2`; ops `v0.1.1`; MVP `v0.1.0`)
