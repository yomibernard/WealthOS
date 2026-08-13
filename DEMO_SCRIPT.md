# WealthOS demo script (20–25 minutes)

Product promise: **Know what you have. Know where you are going. Know what to do next.**

Password for all demo users: `WealthOSdemo1!`

Presenter checklist UI: `/demo`

## Cast

| Role | Login | Story |
|------|-------|--------|
| Executive | yomi@demo.wealthos.ng | Property-heavy, education goals, inbox + estate |
| Entrepreneur | amaka@demo.wealthos.ng | Business concentration, lending pressure |
| Diaspora | chioma@demo.wealthos.ng | FX, UK pension, crypto awareness |
| Adviser | adviser@demo.wealthos.ng | Insights pack, nudges, shared notes |
| Admin / checker | admin@ / checker@ | Maker-checker |

## Act 1 — First value (3 min)

1. Open `/` — brand + promise
2. Run **Wealth Check** (`/wealth-check`) conversational fact-find
3. Land on estimated net worth + health + top actions (no product push)

## Act 2 — Persona A depth (5 min)

1. Sign in as Yomi
2. **Home** — net worth, health, Wealth Inbox unread; optional **Fix data quality**
3. **Wealth** — provenance, confidence, allocation
4. **Property** — equity / LTV / concentration
5. **Plan** — goals; open **Goal funding pulse**
6. **Actions** — explain before accept; mention do-nothing is valid
7. **WealthGuard** — paste a “guaranteed 30% WhatsApp” style offer (labels stay cautious)

## Act 3 — Cadence tools (4 min)

1. **Monthly reports** (`/app/reports`) — generate; show MoM / sparkline after a second run
2. **Weekly digest** (`/app/digest`) — generate; show watch vs steady sections
3. **Profile** (`/app/profile`) — checklist + Continue next gap
4. **Notifications** — channel prefs; Informational gates digests/reports

## Act 4 — Boundaries (3 min)

1. **Crypto** — inventory + deferred trading list
2. **Lending** — debt service; no loan offers
3. **Tax lite** — illustrative only disclaimer
4. **Estate** — readiness score, not legal drafting

## Act 5 — Trust, adviser loop & ops (5 min)

1. **Consent Centre** — pause AI consent; show AI blocked; restore
2. **Connections** — sync demo bank (consent-gated)
3. As Yomi — **Adviser collaboration** → **Share a briefing** (full or digest)
4. **Adviser** portal — customer 360 **Insights pack** talking points; send a **nudge** (e.g. refresh data)
5. Back as Yomi — **Inbox** shows nudge deep link; open target page
6. **Admin** — flags, monitoring, maker-checker; `/admin/ops` launch gate

## Closing lines

- Engines are deterministic; AI explains, does not invent balances
- Execution partner rail is demo-only (`fundsMoved: false`)
- Cadence tools (report / digest / funding / profile) never move money
- Adviser share + nudge are human collaboration, not auto-advice
- Postgres cutover, CI, and Vercel `build:vercel` exist for hosted pilots

## Recovery

If seed is messy: `npm run db:setup` locally (never in prod).  
If Prisma DLL lock on Windows: stop `next dev`, then regenerate.
