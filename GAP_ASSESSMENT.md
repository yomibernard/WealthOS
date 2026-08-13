# WealthOS Gap Assessment & Implementation Plan

**Date:** 12 August 2026  
**Status:** Greenfield — no application code existed

## Current state

| Item | Finding |
|------|---------|
| Application code | None |
| Stack | Not established |
| Routes / components | N/A |
| Data model | PRD only (`WealthOS_PRD_v1.0.docx`) |
| APIs | None |
| Security | None |
| Reference assets | Saved HTML research page; PRD v1.0 |

## Target architecture (Phase 1 MVP)

```
Frontend (Next.js App Router, mobile-first)
  → BFF / Route Handlers
  → Identity & Consent
  → Wealth Domain Services
  → Deterministic Financial Engines
  → AI Orchestration (agents + tools)
  → Compliance / Suitability / Audit
  → Integration abstractions (banks, FX, providers)
```

**Stack:** Next.js 15, TypeScript, Prisma (SQLite for local MVP), Zod, Tailwind CSS, Vitest.

## Gap matrix (all P0 → build)

| Capability | Gap | Epic |
|------------|-----|------|
| Design system | Missing | E1 |
| Domain model / DB | Missing | E2 |
| Net worth, FX, health, suitability, NBFA | Missing | E3 |
| Wealth Graph CRUD + provenance | Missing | E4 |
| Wealth Health versioned score | Missing | E5 |
| WealthAI multi-agent orchestration | Missing | E6 |
| WealthPlan + Digital Twin Lite | Missing | E7 |
| WealthAction + explanations | Missing | E8 |
| Product Graph + comparison | Missing | E9 |
| WealthGuard | Missing | E10 |
| Consent Centre | Missing | E11 |
| Adviser + Admin portals (MVP) | Missing | E12 |
| Seed personas A/B/C | Missing | E13 |
| Tests + journey validation | Missing | E14 |

## Explicitly deferred (Phase 2+)

Live marketplace execution, open banking, crypto, lending, payments super-app, insurance underwriting, property marketplace, full tax filing, trust/will admin, social/community, referral gamification.

## Migration risk

None — greenfield. SQLite → PostgreSQL path via Prisma datasource swap.
