# WealthOS deploy & pilot guide

Use this after the local MVP works (`npm run db:setup` → `npm run dev`).

## 0. Preconditions

- [ ] `npm run test` and `npm run build` green locally
- [ ] `LAUNCH_REVIEW.md` section A understood
- [ ] Postgres target ready (managed or Docker) — see [POSTGRES_CUTOVER.md](./POSTGRES_CUTOVER.md)
- [ ] Strong `SESSION_SECRET` generated (≥32 random chars)
- [ ] `DEMO_MODE=false` for any shared/pilot URL

## 1. Environment

Copy [`.env.example`](./.env.example) and set at least:

| Variable | Pilot value |
|----------|-------------|
| `DATABASE_URL` | Postgres connection string |
| `SESSION_SECRET` | Unique secret (not the MVP default) |
| `DEMO_MODE` | `false` |
| `LAUNCH_PROFILE` | `production` (optional; forces hard gate) |
| `OPENAI_API_KEY` | Optional; enables grounded LLM polish only |

Feature flags can stay on for a closed walkthrough. For a **shared pilot URL**, prefer the **safe pilot** profile on `/admin/flags` (`FF_PARTNER_EXECUTION=false`, `FF_LLM_POLISH=false`). Copy the snippet into Vercel env and redeploy.

## 2. Database

```bash
npm run db:use-postgres
npx prisma migrate deploy
# Optional controlled seed for closed demo only — never on production customer data:
# npm run db:seed
npm run db:use-sqlite   # restore laptop to SQLite after deploy prep
```

On the host/CI that runs against Postgres, leave the schema on `postgresql` and keep `DATABASE_URL` pointed at Postgres.

## 3. Hosting options

### Vercel (app) + managed Postgres

Repo includes [`vercel.json`](./vercel.json) → `npm run build:vercel` (Postgres schema + `migrate deploy` + `next build`).

1. Create a Postgres database (Neon, Supabase, Railway, or Vercel Postgres).
2. Import [yomibernard/WealthOS](https://github.com/yomibernard/WealthOS) into Vercel (Framework: Next.js).
3. Project → Settings → Environment Variables (Production + Preview):

| Name | Value |
|------|--------|
| `DATABASE_URL` | Postgres URL (pooled + `?schema=public` if required by host) |
| `SESSION_SECRET` | ≥32 random chars (not the MVP default) |
| `DEMO_MODE` | `false` for shared pilot URLs |
| `BASE_CURRENCY` | `NGN` |
| `OPENAI_API_KEY` | optional |

4. Deploy. First build runs migrations via `build:vercel`. To migrate out-of-band instead, set `SKIP_MIGRATE_ON_BUILD=true` and run `npx prisma migrate deploy` locally against prod.
5. Optional closed-demo seed (once, never against real customers): point `DATABASE_URL` at prod and `npm run db:seed` from a trusted machine after `db:use-postgres`.
6. Smoke: `/api/health`, sign-in, `/app`, WealthAI with consent on.

SQLite `file:` URLs fail closed in `build:vercel` — Postgres is required on Vercel.

CLI (if logged in): `npx vercel link` then `npx vercel --prod`.

### Docker Compose (self-host demo)

```bash
npm run db:up
# set DATABASE_URL to the compose Postgres URL (see .env.postgres.example)
npm run db:use-postgres
npx prisma migrate deploy
npm run db:seed
npm run build && npm run start
```

## 4. Health & gates

- Probe: `GET /api/health` (includes `config.demoMode` + `config.databaseKind`, never secrets)
- Dev gate: `npm run launch:check`
- Prod gate: `LAUNCH_PROFILE=production npm run launch:check` (must pass before public pilot)
- Umbrella: `npm run release:check`

### Post-deploy hosted smoke

After Vercel (or other host) finishes deploying:

```bash
SMOKE_BASE_URL=https://your-app.vercel.app npm run smoke:hosted
```

Optional:

| Variable | Effect |
|----------|--------|
| `SMOKE_STRICT=1` | Fail on DEMO_MODE / launch-gate warns |
| `SMOKE_SKIP_AUTH=1` | Skip demo sign-in (no seed on host) |
| `SMOKE_EMAIL` / `SMOKE_PASSWORD` | Non-default pilot user |

Local laptop smoke remains `npm run smoke` (allows localhost).

## 5. Release tagging

Annotated tag for the freeze candidate (created on `main` when cutting the release):

```bash
git tag -a v0.1.21 -m "WealthOS adviser ops-remind cues pack 0.1.21"
git push origin v0.1.21
```

Prior tags: `v0.1.20` (ops queue care remind), `v0.1.19` (ops care remind), `v0.1.18` (admin WealthAI ops), `v0.1.17` (admin/ops next-steps), `v0.1.16` (adviser WealthAI book), `v0.1.15` (adviser book next-steps), `v0.1.14` (Home next-steps), `v0.1.13` (inbox triage), `v0.1.12` (customer notify triage), `v0.1.11` (adviser triage), `v0.1.10` (adviser notifications), `v0.1.9` (close-loop), `v0.1.8` (care receipts), `v0.1.7` (WealthAI care), `v0.1.6` (customer care), `v0.1.5` (ops care), `v0.1.4` (care UX), `v0.1.3` (care), `v0.1.2` (trust loop), `v0.1.1` (ops), `v0.1.0` (MVP). Record the tag SHA on [LAUNCH_REVIEW.md](./LAUNCH_REVIEW.md) go/no-go. Run `npm run pilot:freeze` before tagging.

## 6. What not to do

- Do not run `npm run db:setup` against production (push + reseed).
- Do not ship with `DEMO_MODE=true` or the default session secret.
- Do not claim live bank login, fund movement, loan origination, or regulated advice.
