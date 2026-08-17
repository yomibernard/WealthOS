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
| Adviser | adviser@demo.wealthos.ng | Care radar, Care desk, insights, nudges |
| Admin / checker | admin@ / checker@ | Maker-checker |

## Act 1 — First value (3 min)

1. Open `/` — brand + promise
2. Run **Wealth Check** (`/wealth-check`) conversational fact-find
3. Land on estimated net worth + health + top actions (no product push)

## Act 2 — Persona A depth (5 min)

1. Sign in as Yomi
2. **Home** — net worth, health, **Needs your attention** next-steps (deep links) · Wealth Inbox unread → `/app/inbox?status=unread` triage; optional **Fix data quality**
3. Optional: **WealthAI** — “What should I do next?” cites the same next-steps pulse with paths
4. **Wealth** — provenance, confidence, allocation
5. **Property** — equity / LTV / concentration
6. **Plan** — goals; open **Goal funding pulse**
7. **Actions** — explain before accept; mention do-nothing is valid
8. **WealthGuard** — paste a “guaranteed 30% WhatsApp” style offer (labels stay cautious)

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
4. **Adviser** portal — **Needs your attention** book next-steps → Care desk / filters; **Care radar** (`Needs care` / **Ops reminded** / **Unacked** / Complaints / Privacy / Support) → 360 **Care desk** (see **recent acks**, optional **acknowledge**) + **Insights**; send a **nudge**
4b. Optional: **WealthAI (book)** (`/adviser/ai`) — “What should I do next for my book?” cites the same Care radar pulse with `/adviser…` paths
5. Back as Yomi — **Home** may show **care update** CTA and **unread notifications** pulse (seeded after `db:setup`) → **Notifications** triage (**Unread** / **Care** / **Cadence**) → **Mark as read** / **Mark all as read**; **Support** or **Privacy** lists the acknowledgment → **Mark as seen**; **Inbox** shows care/nudge deep links
5b. Optional: **WealthAI** (`/app/ai`) — ask “Where do I see my adviser care update?” (grounded unseen pulse; ops still authoritative)
5c. Back as Ada — **Adviser notifications** (`/adviser/notifications`) — triage **Unread** / **Care receipts** / **Shares**, open Care desk, optional **Mark all as read**; 360 history **Seen** / **Unseen**; Care radar **Awaiting receipt**; Admin ops shows recent receipts
5d. Optional: `/adviser?care=awaiting` after Yomi marks seen (clears awaiting; ops lists receipt)
6. **Admin** — **Needs your attention** ops next-steps on `/admin` / `/admin/ops` (escalations, privacy, **care handoff**, maker-checker, flag risk)
6a. Optional: **Remind linked advisers** on Care handoff (unacked) → Ada **notifications** (**Care handoff** filter) + Care radar **Ops reminded** (`?care=ops_reminded`) / Care desk banner → ack → ops **Recent ops reminds** + **Recent remind answers** (+ admin **Remind answered** notify); queues stay open
6b. Optional: on `/admin/escalations` or `/admin/privacy`, **Remind adviser** on a **No care ack** row (same notify; queues stay open)
6c. Optional: **WealthAI (ops)** (`/admin/ai`) — “What should I do next for ops?” cites the same daily board pulse with `/admin…` paths
7. Optional: `/admin/escalations` + `/admin/privacy` — note **care-ack** badges + Care desk links + per-row Remind; `/admin/flags` safe pilot; `/admin/audit` filter + download
8. Trust loop (optional, ~2 min): Yomi `/app/support` → case; admin resolve → Yomi **Home** / **Inbox** / **Notifications** deep-link back to Support; optional WealthAI “care update” question
9. Privacy loop (optional): Yomi Privacy Centre request → admin `/admin/privacy` → Yomi Inbox/Notifications → `/app/privacy` (care updates if acked)

## Closing lines

- Engines are deterministic; AI explains, does not invent balances
- Execution partner rail is demo-only (`fundsMoved: false`)
- Cadence tools (report / digest / funding / profile) never move money
- Adviser share + nudge are human collaboration, not auto-advice
- Support/complaints close in-product; hosted smoke via `npm run smoke:hosted`
- Postgres cutover, CI, and Vercel `build:vercel` exist for hosted pilots

## Recovery

If seed is messy: `npm run db:setup` locally (never in prod).  
If Prisma DLL lock on Windows: stop `next dev`, then regenerate.
