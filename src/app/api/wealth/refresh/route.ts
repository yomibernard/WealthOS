import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";

const schema = z.object({
  kind: z.enum(["asset", "liability"]),
  id: z.string().min(1),
  mode: z.enum(["confirm", "update"]),
  value: z.number().positive().optional(),
  verificationStatus: z.enum(["ESTIMATED", "VERIFIED", "STALE"]).optional(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  try {
    const body = schema.parse(await req.json());
    const now = new Date();

    if (body.kind === "asset") {
      const existing = await prisma.asset.findFirst({
        where: { id: body.id, userId: user.id },
      });
      if (!existing) {
        return NextResponse.json({ error: "Asset not found." }, { status: 404 });
      }

      const nextValue = body.mode === "update" && body.value != null ? body.value : existing.value;
      const nextStatus =
        body.verificationStatus ??
        (body.mode === "confirm" && existing.verificationStatus === "STALE"
          ? "ESTIMATED"
          : existing.verificationStatus === "STALE"
            ? "ESTIMATED"
            : existing.verificationStatus);

      const bumpedConfidence = Math.min(
        0.95,
        Math.max(existing.confidence, body.mode === "confirm" ? 0.75 : 0.8) +
          (nextStatus === "VERIFIED" ? 0.1 : 0),
      );

      const item = await prisma.asset.update({
        where: { id: existing.id },
        data: {
          value: nextValue,
          lastValuationDate: now,
          verificationStatus: nextStatus,
          confidence: bumpedConfidence,
        },
      });

      await prisma.auditEvent.create({
        data: {
          userId: user.id,
          eventType: body.mode === "confirm" ? "ASSET_VALUATION_CONFIRMED" : "ASSET_VALUATION_UPDATED",
          entityType: "Asset",
          entityId: item.id,
          payloadJson: JSON.stringify({
            value: item.value,
            verificationStatus: item.verificationStatus,
            confidence: item.confidence,
          }),
        },
      });

      return NextResponse.json({
        ok: true,
        id: item.id,
        confidence: item.confidence,
        lastValuationDate: item.lastValuationDate,
      });
    }

    const existing = await prisma.liability.findFirst({
      where: { id: body.id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Liability not found." }, { status: 404 });
    }

    const nextBalance =
      body.mode === "update" && body.value != null ? body.value : existing.balance;
    const nextStatus =
      body.verificationStatus ??
      (existing.verificationStatus === "STALE" ? "ESTIMATED" : existing.verificationStatus);
    const bumpedConfidence = Math.min(
      0.95,
      Math.max(existing.confidence, body.mode === "confirm" ? 0.75 : 0.8),
    );

    const item = await prisma.liability.update({
      where: { id: existing.id },
      data: {
        balance: nextBalance,
        lastValuationDate: now,
        verificationStatus: nextStatus,
        confidence: bumpedConfidence,
      },
    });

    await prisma.auditEvent.create({
      data: {
        userId: user.id,
        eventType:
          body.mode === "confirm" ? "LIABILITY_BALANCE_CONFIRMED" : "LIABILITY_BALANCE_UPDATED",
        entityType: "Liability",
        entityId: item.id,
        payloadJson: JSON.stringify({
          balance: item.balance,
          verificationStatus: item.verificationStatus,
          confidence: item.confidence,
        }),
      },
    });

    return NextResponse.json({
      ok: true,
      id: item.id,
      confidence: item.confidence,
      lastValuationDate: item.lastValuationDate,
    });
  } catch {
    return NextResponse.json(
      { error: "We could not refresh that Wealth Graph item." },
      { status: 400 },
    );
  }
}
