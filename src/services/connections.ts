import { prisma } from "@/lib/db";
import {
  DEMO_BANKS,
  bankFromCode,
  simulateOpenBankingSync,
} from "@/integrations/open-banking";

export async function listConnections(userId: string) {
  return prisma.connection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function connectDemoBank(userId: string, bankCode: string) {
  const bank = bankFromCode(bankCode);
  if (!bank) throw new Error("Unknown demo bank.");

  const existing = await prisma.connection.findFirst({
    where: { userId, providerName: bank.providerLabel },
  });
  if (existing) return existing;

  const consent = await prisma.consent.create({
    data: {
      userId,
      serviceName: bank.providerLabel,
      dataUsed: "Account balances and transactions (demo)",
      purpose: "Wealth Graph refresh via open-banking demo rail",
      status: "ACTIVE",
      lastAccessAt: new Date(),
    },
  });

  const connection = await prisma.connection.create({
    data: {
      userId,
      providerName: bank.providerLabel,
      kind: "open_banking",
      status: "healthy",
      lastSyncAt: new Date(),
      consentId: consent.id,
    },
  });

  await prisma.auditEvent.create({
    data: {
      userId,
      eventType: "connection.connect",
      entityType: "Connection",
      entityId: connection.id,
      payloadJson: JSON.stringify({ bank: bank.code, demo: true }),
    },
  });

  return connection;
}

export async function syncConnection(userId: string, connectionId: string) {
  const connection = await prisma.connection.findFirst({
    where: { id: connectionId, userId },
  });
  if (!connection) throw new Error("Connection not found.");

  let consentActive = true;
  if (connection.consentId) {
    const consent = await prisma.consent.findUnique({ where: { id: connection.consentId } });
    consentActive = consent?.status === "ACTIVE";
    if (consent && consentActive) {
      await prisma.consent.update({
        where: { id: consent.id },
        data: { lastAccessAt: new Date() },
      });
    }
  }

  const outcome = simulateOpenBankingSync({
    providerName: connection.providerName,
    previousStatus: connection.status,
    consentActive,
  });

  const updated = await prisma.connection.update({
    where: { id: connection.id },
    data: {
      status: outcome.status,
      lastError: outcome.lastError,
      lastSyncAt: new Date(),
    },
  });

  if (outcome.balancesTouched && connection.kind === "open_banking") {
    const bankToken = connection.providerName.split(" ")[0] ?? "";
    await prisma.asset.updateMany({
      where: {
        userId,
        category: "CASH",
        OR: [
          { provider: { contains: bankToken } },
          { name: { contains: bankToken } },
        ],
      },
      data: {
        source: "CONNECTED",
        verificationStatus: "VERIFIED",
        confidence: 0.92,
        lastValuationDate: new Date(),
      },
    });
  }

  await prisma.auditEvent.create({
    data: {
      userId,
      eventType: "connection.sync",
      entityType: "Connection",
      entityId: connection.id,
      payloadJson: JSON.stringify({
        status: outcome.status,
        message: outcome.message,
        adapter: outcome.adapterVersion,
      }),
    },
  });

  return { connection: updated, outcome };
}

export async function disconnectConnection(userId: string, connectionId: string) {
  const connection = await prisma.connection.findFirst({
    where: { id: connectionId, userId },
  });
  if (!connection) throw new Error("Connection not found.");

  if (connection.consentId) {
    await prisma.consent.update({
      where: { id: connection.consentId },
      data: { status: "PAUSED" },
    });
  }

  const updated = await prisma.connection.update({
    where: { id: connection.id },
    data: {
      status: "disconnected",
      lastError: "Disconnected by customer",
    },
  });

  await prisma.auditEvent.create({
    data: {
      userId,
      eventType: "connection.disconnect",
      entityType: "Connection",
      entityId: connection.id,
      payloadJson: JSON.stringify({ demo: true }),
    },
  });

  return updated;
}

export function availableDemoBanks() {
  return DEMO_BANKS;
}
