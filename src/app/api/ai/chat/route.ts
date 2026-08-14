import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { loadCustomerContext } from "@/services/wealth";
import { loadNextStepsPulse } from "@/services/next-steps";
import { runWealthAI } from "@/ai/orchestrator";
import { polishGroundedAnswer } from "@/ai/llm";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { getFeatureFlags } from "@/lib/feature-flags";

const schema = z.object({
  message: z.string().min(1).max(8000),
  conversationId: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in to use WealthAI." }, { status: 401 });
  }

  const limited = rateLimit(clientKey(req, `ai:${user.id}`), 40, 60_000);
  if (!limited.allowed) {
    return NextResponse.json(
      {
        content: "I need a short pause — too many requests just now. Please try again shortly.",
        agent: "ConciergeAI",
        confidence: 1,
      },
      { status: 429 },
    );
  }

  try {
    const body = schema.parse(await req.json());
    const ctx = await loadCustomerContext(user.id);
    if (!ctx) {
      return NextResponse.json({
        content:
          "I do not have enough verified information to answer this confidently. Please complete your Wealth Graph.",
        confidence: 0.2,
        agent: "ConciergeAI",
      });
    }

    // Consent gate for AI personalisation
    if (!ctx.consentsActive.some((c) => /wealthai|analysis/i.test(c))) {
      return NextResponse.json({
        content:
          "WealthAI personalisation is paused because consent is not active. Re-enable it in the Consent Centre to continue with tailored analysis.",
        confidence: 1,
        agent: "ComplianceAI",
        escalate: false,
      });
    }

    const nextSteps = await loadNextStepsPulse(user.id);
    const result = runWealthAI(body.message, { ...ctx, nextSteps });

    const flags = getFeatureFlags();
    const polished = flags.llmPolish
      ? await polishGroundedAnswer({
          draft: result.content,
          facts: [
            result.content,
            ...result.assumptions,
            ...result.missingInformation.map((m) => `Missing: ${m}`),
          ],
          intent: result.intent,
          agent: result.agent,
          missingInformation: result.missingInformation,
          assumptions: result.assumptions,
        })
      : null;
    const content = polished ?? result.content;
    const llmPolished = Boolean(polished);

    let conversationId = body.conversationId;
    if (!conversationId) {
      const conversation = await prisma.conversation.create({
        data: { userId: user.id, title: body.message.slice(0, 60) },
      });
      conversationId = conversation.id;
    }

    await prisma.message.createMany({
      data: [
        {
          conversationId,
          role: "user",
          content: body.message,
        },
        {
          conversationId,
          role: "assistant",
          content,
          agentUsed: result.agent,
          intent: result.intent,
          toolsUsedJson: JSON.stringify([
            ...result.toolsUsed,
            ...(llmPolished ? ["llmPolish"] : []),
          ]),
          confidence: result.confidence,
          escalated: result.escalate,
        },
      ],
    });

    if (result.escalate) {
      await prisma.escalation.create({
        data: {
          userId: user.id,
          level: result.intent === "escalation" ? "L3_ADVISER" : "L2_SUPPORT",
          reason: result.escalationReason ?? "AI escalation",
          summary: content.slice(0, 500),
        },
      });
    }

    await prisma.auditEvent.create({
      data: {
        userId: user.id,
        eventType: "AI_RESPONSE",
        entityType: "Conversation",
        entityId: conversationId,
        payloadJson: JSON.stringify({
          intent: result.intent,
          agent: result.agent,
          toolsUsed: result.toolsUsed,
          confidence: result.confidence,
          assumptions: result.assumptions,
          missingInformation: result.missingInformation,
          escalate: result.escalate,
          llmPolished,
        }),
      },
    });

    return NextResponse.json({
      ...result,
      content,
      llmPolished,
      conversationId,
    });
  } catch {
    return NextResponse.json(
      {
        content:
          "I could not complete that analysis right now. Your information is safe — please try again or request an adviser review.",
        confidence: 0,
        agent: "ConciergeAI",
      },
      { status: 500 },
    );
  }
}
