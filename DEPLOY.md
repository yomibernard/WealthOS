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

Feature flags can stay on for a closed pilot; turn off `FF_PARTNER_EXECUTION` if you do not want the demo rail visible.

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

1. Import [yomibernard/WealthOS](https://github.com/yomibernard/WealthOS).
2. Framework preset: Next.js.
3. Add env vars from the table above.
4. Build command: `prisma generate && next build` (or default `next build` — `postinstall` already runs `prisma generate`).
5. Run migrations against Postgres **before** first traffic: `npx prisma migrate deploy` from a machine with prod `DATABASE_URL`, or a one-off deploy job.
6. Smoke: `/api/health`, sign-in, `/app`, WealthAI with consent on.

SQLite file URLs do **not** work on serverless — Postgres is required for Vercel.

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

- Probe: `GET /api/health`
- Dev gate: `npm run launch:check`
- Prod gate: `LAUNCH_PROFILE=production npm run launch:check` (must pass before public pilot)
- Umbrella: `npm run release:check`

## 5. Release tagging

```bash
git tag -a v0.1.0 -m "WealthOS MVP 0.1.0"
git push origin v0.1.0
```

Record the tag on [LAUNCH_REVIEW.md](./LAUNCH_REVIEW.md) go/no-go.

## 6. What not to do

- Do not run `npm run db:setup` against production (push + reseed).
- Do not ship with `DEMO_MODE=true` or the default session secret.
- Do not claim live bank login, fund movement, loan origination, or regulated advice.
