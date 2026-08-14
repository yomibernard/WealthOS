import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { loadAdviserNextStepsPulse } from "@/services/adviser-next-steps";
import { runAdviserWealthAI } from "@/ai/orchestrator";
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
  if (user.role !== "ADVISER" && user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Adviser WealthAI is for adviser and admin roles." },
      { status: 403 },
    );
  }

  const limited = rateLimit(clientKey(req, `adviser-ai:${user.id}`), 40, 60_000);
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
    const pulse = await loadAdviserNextStepsPulse({
      adviserId: user.id,
      role: user.role,
    });
    const result = runAdviserWealthAI(body.message, pulse);

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

    await prisma.auditEvent.create({
      data: {
        userId: user.id,
        eventType: "AI_RESPONSE",
        entityType: "Conversation",
        entityId: conversationId,
        payloadJson: JSON.stringify({
          channel: "adviser",
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
          "I could not complete that analysis right now. Your book data is safe — please try again or open Care radar.",
        confidence: 0,
        agent: "ConciergeAI",
      },
      { status: 500 },
    );
  }
}
