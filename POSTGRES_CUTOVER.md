# WealthOS Postgres production cutover checklist

Local MVP uses SQLite (`DATABASE_URL=file:./dev.db`). Production should use PostgreSQL.

## Pre-flight

- [ ] Postgres 14+ instance provisioned (managed preferred: RDS, Cloud SQL, Neon, Supabase, etc.)
- [ ] Network access from app runtime only (private network / IP allowlist)
- [ ] Strong credentials in a secrets manager — never commit `.env` production URLs
- [ ] Confirm Prisma schema has **no SQLite-only** types (WealthOS models are portable)
- [ ] Run `npm run test` and `npm run build` on the release commit
- [ ] Run `npm run perf:check` after build
- [ ] Feature flags reviewed (`FF_*`) for production defaults

## Schema cutover

Committed artefacts (Phase 4.2):

- `prisma/schema.postgresql.prisma` — Postgres datasource mirror
- `prisma/migrations-postgres/` — init migration SQL + lock (safe while local MVP stays on SQLite)
- `docker-compose.yml` — local Postgres 16
- `.env.postgres.example` — sample env

### Local Postgres rehearsal

```bash
npm run db:up            # maps host port 5434 → container 5432
# point .env at .env.postgres.example values (localhost:5434)
npm run db:use-postgres
npx prisma generate
npx prisma migrate deploy
npm run db:seed          # staging/demo only — never production
npm run dev
# when done returning to SQLite MVP:
npm run db:use-sqlite
# restore DATABASE_URL=file:./dev.db
```

Or one-shot: `npm run db:rehearse-postgres` (restores SQLite afterwards).

### Production

1. Snapshot / backup any SQLite data you still need (optional Privacy Centre JSON export).
2. Set production env from secrets manager (see `.env.postgres.example` shape):
   ```bash
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/wealthos?schema=public&sslmode=require"
   ```
3. Activate Postgres migrations on the release artifact:
   ```bash
   npm run db:use-postgres
   npx prisma generate
   npx prisma migrate deploy
   ```
4. **Do not** run `npm run db:setup` / `db:seed` against production.
5. After deploy validation, keep `schema.prisma` on `postgresql` in the prod branch/tag.

### Regenerating migration SQL after schema changes

```bash
npm run db:gen-pg-migration
```

Review the diff under `prisma/migrations-postgres/` before release.

## App config

- [ ] `SESSION_SECRET` rotated to a long random value
- [ ] `DEMO_MODE=false` (or equivalent) in production
- [ ] `OPENAI_API_KEY` only if LLM polish is approved
- [ ] Document storage path / object store configured (`.data/docs` is local-demo only)
- [ ] Rate limiting: plan Redis swap for multi-instance (`src/lib/rate-limit.ts` is in-memory)
- [ ] HTTPS termination and secure cookies verified

## Validation

- [ ] Sign-in with a non-seed admin created via controlled bootstrap
- [ ] Wealth Graph CRUD, AI chat consent gate, WealthGuard, Privacy export
- [ ] Maker-checker: admin propose / checker approve (no self-approve)
- [ ] Partner execution still `fundsMoved: false` until a real rail is contracted
- [ ] Erasure workflow smoke-tested on a disposable account

## Rollback

- [ ] Keep previous app release artifact
- [ ] Keep Postgres backup from immediately before migrate
- [ ] If migrate fails, restore DB backup and redeploy prior app version — do not dual-write SQLite+Postgres

## Post-cutover

- [ ] Enable monitoring /admin dashboards access for ops only
- [ ] Schedule FX refresh + provider registry SLAs
- [ ] Legal/compliance sign-off before public traffic
