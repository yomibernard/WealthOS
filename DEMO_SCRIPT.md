# WealthOS demo script (15–20 minutes)

Product promise: **Know what you have. Know where you are going. Know what to do next.**

Password for all demo users: `WealthOSdemo1!`

## Cast

| Role | Login | Story |
|------|-------|--------|
| Executive | yomi@demo.wealthos.ng | Property-heavy, education goals, inbox + estate |
| Entrepreneur | amaka@demo.wealthos.ng | Business concentration, lending pressure |
| Diaspora | chioma@demo.wealthos.ng | FX, UK pension, crypto awareness |
| Adviser | adviser@demo.wealthos.ng | Notes + timeline |
| Admin / checker | admin@ / checker@ | Maker-checker |

## Act 1 — First value (3 min)

1. Open `/` — brand + promise
2. Run **Wealth Check** (`/wealth-check`) conversational fact-find
3. Land on estimated net worth + health + top actions (no product push)

## Act 2 — Persona A depth (5 min)

1. Sign in as Yomi
2. **Home** — net worth, health, Wealth Inbox unread
3. **Wealth** — provenance, confidence, allocation
4. **Property** — equity / LTV / concentration
5. **Plan** — goals; optional buy-vs-rent scenarios
6. **Actions** — explain before accept; mention do-nothing is valid
7. **WealthGuard** — paste a “guaranteed 30% WhatsApp” style offer (labels stay cautious)

## Act 3 — Boundaries (3 min)

1. **Crypto** — inventory + deferred trading list
2. **Lending** — debt service; no loan offers
3. **Tax lite** — illustrative only disclaimer
4. **Estate** — readiness score, not legal drafting

## Act 4 — Trust & ops (4 min)

1. **Consent Centre** — pause AI consent; show AI blocked; restore
2. **Connections** — sync demo bank (consent-gated)
3. **Adviser** portal — customer 360, share a plan action note
4. Back as Yomi — **Adviser collaboration** sees shared note
5. **Admin** — flags, monitoring, maker-checker queue (admin proposes, checker approves)

## Closing lines

- Engines are deterministic; AI explains, does not invent balances
- Execution partner rail is demo-only (`fundsMoved: false`)
- Postgres cutover and launch freeze docs exist for production

## Recovery

If seed is messy: `npm run db:setup` locally (never in prod).  
If Prisma DLL lock on Windows: stop `next dev`, then regenerate.
