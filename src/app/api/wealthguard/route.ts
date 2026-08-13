import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { analyseOfferWithRegistry } from "@/engines/wealthguard-async";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { requireFlag } from "@/lib/feature-flags";

const schema = z.object({
  text: z.string().min(10).max(20000),
  sourceType: z.string().default("text"),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const flag = requireFlag("wealthGuardUploads");
  if (!flag.ok) return NextResponse.json({ error: flag.error }, { status: 503 });

  const limited = rateLimit(clientKey(req, `wg:${user.id}`), 20, 60_000);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many WealthGuard analyses. Please wait a moment." },
      { status: 429 },
    );
  }

  try {
    const body = schema.parse(await req.json());
    // Basic document/prompt injection boundary: strip control tokens
    const cleaned = body.text.replace(/```system|ignore previous instructions/gi, "[redacted]");
    const result = await analyseOfferWithRegistry(cleaned);

    await prisma.wealthGuardAnalysis.create({
      data: {
        userId: user.id,
        sourceType: body.sourceType,
        rawText: cleaned.slice(0, 5000),
        extractedJson: JSON.stringify(result.extracted),
        providerVerification: result.providerVerification,
        transparency: result.transparency,
        returnClaim: result.returnClaim,
        overallOutcome: result.overallOutcome,
        explanation: result.explanation,
        warningIndicatorsJson: JSON.stringify(result.warningIndicators),
      },
    });

    await prisma.auditEvent.create({
      data: {
        userId: user.id,
        eventType: "WEALTHGUARD_ANALYSIS",
        payloadJson: JSON.stringify({
          overallOutcome: result.overallOutcome,
          providerVerification: result.providerVerification,
          version: result.version,
        }),
      },
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        error:
          "We could not analyse that offer right now. Your existing information is safe. Please try again.",
      },
      { status: 400 },
    );
  }
}
