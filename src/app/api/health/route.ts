import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { evaluateLaunchGate } from "@/lib/launch-gate";
import { getFeatureFlags } from "@/lib/feature-flags";
import { databaseKindFromUrl } from "@/lib/hosted-smoke";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  let dbOk = false;
  let dbError: string | null = null;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch (err) {
    dbError = err instanceof Error ? err.message : "database unreachable";
  }

  const launch = evaluateLaunchGate();
  const flags = getFeatureFlags();
  const status = dbOk ? "ok" : "degraded";
  const demoMode = ["1", "true", "yes", "on"].includes(
    (process.env.DEMO_MODE ?? "").toLowerCase(),
  );

  return NextResponse.json(
    {
      status,
      service: "wealthos",
      version: process.env.npm_package_version ?? "0.1.2",
      time: new Date().toISOString(),
      latencyMs: Date.now() - started,
      database: { ok: dbOk, error: dbError },
      config: {
        demoMode,
        databaseKind: databaseKindFromUrl(process.env.DATABASE_URL),
      },
      launch: {
        ok: launch.ok,
        profile: launch.profile,
        blockers: launch.checks.filter((c) => c.severity === "blocker" && !c.ok).map((c) => c.id),
      },
      flags: {
        partnerExecution: flags.partnerExecution,
        llmPolish: flags.llmPolish,
        openBankingDemo: flags.openBankingDemo,
      },
    },
    { status: dbOk ? 200 : 503 },
  );
}
