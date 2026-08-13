import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";

const schema = z.object({
  kind: z.string(),
  name: z.string().min(1),
  value: z.number(),
  currency: z.string().default("NGN"),
  ownershipPercent: z.number().min(0).max(100).default(100),
  provider: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to update your Wealth Graph." },
      { status: 401 },
    );
  }

  try {
    const body = schema.parse(await req.json());

    if (body.kind === "liability") {
      const item = await prisma.liability.create({
        data: {
          userId: user.id,
          type: "OTHER",
          name: body.name,
          provider: body.provider,
          balance: body.value,
          currency: body.currency,
          ownershipPercent: body.ownershipPercent,
          source: "MANUAL",
          verificationStatus: "ESTIMATED",
        },
      });
      await prisma.auditEvent.create({
        data: {
          userId: user.id,
          eventType: "LIABILITY_CREATED",
          entityType: "Liability",
          entityId: item.id,
          payloadJson: JSON.stringify({ name: item.name }),
        },
      });
      return NextResponse.json({ ok: true, id: item.id });
    }

    const categoryMap: Record<
      string,
      "CASH" | "INVESTMENT" | "PROPERTY" | "PENSION" | "BUSINESS" | "CRYPTO"
    > = {
      "asset-cash": "CASH",
      "asset-investment": "INVESTMENT",
      "asset-property": "PROPERTY",
      "asset-pension": "PENSION",
      "asset-business": "BUSINESS",
      "asset-crypto": "CRYPTO",
    };

    const category = categoryMap[body.kind] ?? "OTHER";
    const item = await prisma.asset.create({
      data: {
        userId: user.id,
        category,
        assetType: body.kind === "asset-crypto" ? "crypto" : body.kind,
        name: body.name,
        provider: body.provider,
        value: body.value,
        currency: body.currency,
        ownershipPercent: body.ownershipPercent,
        liquidity:
          category === "CASH" || category === "INVESTMENT"
            ? "HIGH"
            : category === "CRYPTO"
              ? "MEDIUM"
              : "ILLIQUID",
        riskClass: category === "CRYPTO" ? "VERY_HIGH" : undefined,
        source: "MANUAL",
        verificationStatus: "ESTIMATED",
        confidence: category === "CRYPTO" ? 0.55 : 0.7,
      },
    });

    await prisma.auditEvent.create({
      data: {
        userId: user.id,
        eventType: "ASSET_CREATED",
        entityType: "Asset",
        entityId: item.id,
        payloadJson: JSON.stringify({ name: item.name, category }),
      },
    });

    return NextResponse.json({ ok: true, id: item.id });
  } catch {
    return NextResponse.json(
      {
        error:
          "We could not update this account right now. Your existing information is safe. Please try again.",
      },
      { status: 400 },
    );
  }
}
