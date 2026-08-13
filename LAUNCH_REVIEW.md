# WealthOS launch review freeze checklist

Use this before any public or regulated pilot. Tick in order; freeze code when section A passes.

## A. Freeze gate (engineering)

- [ ] `npm run test` green
- [ ] `npm run build` green
- [ ] `npm run perf:check` green
- [ ] `npm run launch:check` green (prod profile)
- [ ] `npm run db:postgres-ready` green; `prisma/migrations-postgres` reviewed
- [x] Local Postgres rehearsal done once (`db:rehearse-postgres` / migrate deploy) or waived with owner sign-off
- [ ] No secrets in git (`.env` local only; use `.env.example`)
- [ ] GitHub Actions CI green on `main`
- [ ] Hosted pilot env documented per [DEPLOY.md](./DEPLOY.md)
- [ ] `SESSION_SECRET` is not the MVP default
- [ ] `DEMO_MODE` is not `true` in production
- [ ] Partner execution remains non-moving funds unless contracted rail is live
- [ ] Feature flags documented for launch (AI, WealthGuard uploads, household, etc.)

## B. Product / compliance freeze

- [ ] Suitability before return still enforced in code paths
- [ ] WealthGuard never auto-labels scam/fraud/safe/guaranteed
- [ ] NBFA can recommend do-nothing
- [ ] Consent revoke blocks personalised AI
- [ ] Material actions require step-up (demo code retired or replaced)
- [ ] Crypto / lending pages show deferral (no trading / no loan offers)
- [ ] Tax / estate pages show “not advice / not filing / not legal drafting”
- [ ] Legal counsel sign-off on disclaimers and data processing notice
- [ ] Complaints / escalation path staffed (L2–L5)

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

**Freeze tag / commit:** `v0.1.0` (see git tag; update SHA after `git push origin v0.1.0`)
