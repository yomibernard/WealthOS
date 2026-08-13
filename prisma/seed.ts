import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.suitabilityAssessment.deleteMany();
  await prisma.wealthGuardAnalysis.deleteMany();
  await prisma.wealthSnapshot.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.escalation.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.memoryEntry.deleteMany();
  await prisma.document.deleteMany();
  await prisma.executionReceipt.deleteMany();
  await prisma.executionInstruction.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.privacyRequest.deleteMany();
  await prisma.connection.deleteMany();
  await prisma.changeRequest.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.lifeEvent.deleteMany();
  await prisma.inboxItem.deleteMany();
  await prisma.estateItem.deleteMany();
  await prisma.adviserNote.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.liability.deleteMany();
  await prisma.income.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.householdMember.deleteMany();
  await prisma.riskProfile.deleteMany();
  await prisma.adviserCustomer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.fxRate.deleteMany();
  await prisma.healthScoreConfig.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("WealthOSdemo1!", 10);
  const asOf = new Date();

  await prisma.fxRate.createMany({
    data: [
      { from: "USD", to: "NGN", rate: 1600, asOf, source: "seed" },
      { from: "GBP", to: "NGN", rate: 2050, asOf, source: "seed" },
      { from: "EUR", to: "NGN", rate: 1750, asOf, source: "seed" },
    ],
  });

  await prisma.healthScoreConfig.create({
    data: {
      version: "health-1.0",
      active: true,
      weightsJson: JSON.stringify({
        liquidity: 0.15,
        savings: 0.1,
        debt: 0.15,
        diversification: 0.15,
        goalReadiness: 0.15,
        protection: 0.1,
        retirement: 0.1,
        estate: 0.1,
      }),
    },
  });

  const arm = await prisma.provider.create({
    data: {
      name: "ARM Investment Managers",
      licenceStatus: "SEC registered",
      licenceNumber: "SEC-DEMO-001",
      regulator: "SEC Nigeria",
      verified: true,
    },
  });
  const stanbic = await prisma.provider.create({
    data: {
      name: "Stanbic IBTC Asset Management",
      licenceStatus: "SEC registered",
      licenceNumber: "SEC-DEMO-002",
      regulator: "SEC Nigeria",
      verified: true,
    },
  });
  const unknown = await prisma.provider.create({
    data: {
      name: "Horizon Yield Partners",
      licenceStatus: "Unable to verify",
      verified: false,
    },
  });

  await prisma.product.createMany({
    data: [
      {
        providerId: arm.id,
        name: "ARM Money Market Fund",
        assetClass: "Money market",
        currency: "NGN",
        minimumInvestment: 10000,
        riskRating: "LOW",
        liquidity: "HIGH",
        settlementDays: 1,
        feesJson: JSON.stringify({ management: "1.0% p.a." }),
        historicalPerfJson: JSON.stringify({ note: "Past performance is not a guide" }),
        investmentObjective: "Capital preservation and liquidity",
        keyRisks: "Interest rate and inflation risk",
        approvalStatus: "approved",
      },
      {
        providerId: stanbic.id,
        name: "Stanbic IBTC Bond Fund",
        assetClass: "Fixed income",
        currency: "NGN",
        minimumInvestment: 50000,
        riskRating: "MEDIUM",
        liquidity: "MEDIUM",
        settlementDays: 3,
        feesJson: JSON.stringify({ management: "1.5% p.a." }),
        investmentObjective: "Income with moderate risk",
        keyRisks: "Interest rate, credit and liquidity risk",
        approvalStatus: "approved",
      },
      {
        providerId: unknown.id,
        name: "Horizon 10x Opportunity Note",
        assetClass: "Alternative",
        currency: "USD",
        minimumInvestment: 5000,
        riskRating: "VERY_HIGH",
        liquidity: "ILLIQUID",
        settlementDays: 90,
        feesJson: JSON.stringify({ unclear: true }),
        approvalStatus: "suspended",
        keyRisks: "Opaque structure; verification incomplete",
      },
    ],
  });

  // Persona A — Nigerian executive (Yomi)
  const yomi = await prisma.user.create({
    data: {
      email: "yomi@demo.wealthos.ng",
      passwordHash,
      name: "Yomi Adebayo",
      role: "CUSTOMER",
      employmentStatus: "Employed",
      riskTolerance: "balanced",
      investmentExperience: "intermediate",
      liquidityNeeds: "medium",
      profileCompleteness: 82,
      dateOfBirth: new Date("1983-04-12"),
    },
  });

  await prisma.riskProfile.create({
    data: {
      userId: yomi.id,
      riskTolerance: "balanced",
      capacityForLoss: "medium",
      investmentHorizon: "10",
      knowledgeLevel: "intermediate",
    },
  });

  await prisma.householdMember.createMany({
    data: [
      { userId: yomi.id, name: "Ada Adebayo", relationship: "spouse", dependant: false },
      {
        userId: yomi.id,
        name: "Tolu Adebayo",
        relationship: "child",
        dependant: true,
        dateOfBirth: new Date("2014-06-01"),
      },
      {
        userId: yomi.id,
        name: "Kemi Adebayo",
        relationship: "child",
        dependant: true,
        dateOfBirth: new Date("2017-09-15"),
      },
    ],
  });

  await prisma.income.createMany({
    data: [
      {
        userId: yomi.id,
        type: "salary",
        label: "Executive salary",
        amount: 4500000,
        frequency: "monthly",
      },
      {
        userId: yomi.id,
        type: "investment",
        label: "Fund distributions",
        amount: 350000,
        frequency: "monthly",
      },
    ],
  });

  await prisma.expense.createMany({
    data: [
      {
        userId: yomi.id,
        category: "housing",
        label: "Family living & housing",
        amount: 1800000,
        frequency: "monthly",
      },
      {
        userId: yomi.id,
        category: "education",
        label: "School fees accrual",
        amount: 600000,
        frequency: "monthly",
      },
      {
        userId: yomi.id,
        category: "family",
        label: "Extended family support",
        amount: 250000,
        frequency: "monthly",
      },
    ],
  });

  const monthsAgo = (n: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() - n);
    return d;
  };

  await prisma.asset.createMany({
    data: [
      {
        userId: yomi.id,
        category: "CASH",
        assetType: "bank",
        name: "GTBank salary account",
        provider: "GTBank",
        value: 7450000,
        currency: "NGN",
        liquidity: "HIGH",
        riskClass: "VERY_LOW",
        source: "CONNECTED",
        verificationStatus: "VERIFIED",
        confidence: 0.98,
        lastValuationDate: new Date(),
      },
      {
        userId: yomi.id,
        category: "CASH",
        assetType: "usd_account",
        name: "USD domiciliary",
        provider: "Access Bank",
        value: 42000,
        currency: "USD",
        liquidity: "HIGH",
        riskClass: "LOW",
        source: "MANUAL",
        verificationStatus: "ESTIMATED",
        confidence: 0.85,
        lastValuationDate: monthsAgo(1),
      },
      {
        userId: yomi.id,
        category: "INVESTMENT",
        assetType: "money_market",
        name: "ARM Money Market Fund",
        provider: "ARM",
        value: 18500000,
        currency: "NGN",
        liquidity: "HIGH",
        riskClass: "LOW",
        source: "MANUAL",
        verificationStatus: "VERIFIED",
        confidence: 0.9,
        lastValuationDate: monthsAgo(0),
      },
      {
        userId: yomi.id,
        category: "PROPERTY",
        assetType: "residential",
        name: "Lekki family home",
        provider: "Self",
        value: 95000000,
        currency: "NGN",
        ownershipPercent: 50,
        liquidity: "ILLIQUID",
        riskClass: "MEDIUM",
        source: "MANUAL",
        verificationStatus: "ESTIMATED",
        confidence: 0.65,
        lastValuationDate: monthsAgo(7),
      },
      {
        userId: yomi.id,
        category: "PROPERTY",
        assetType: "investment_property",
        name: "Abuja rental flat",
        value: 65000000,
        currency: "NGN",
        ownershipPercent: 100,
        liquidity: "ILLIQUID",
        riskClass: "MEDIUM",
        source: "MANUAL",
        verificationStatus: "ESTIMATED",
        confidence: 0.6,
        lastValuationDate: monthsAgo(8),
        incomeGenerated: 450000,
      },
      {
        userId: yomi.id,
        category: "PENSION",
        assetType: "rsa",
        name: "RSA — Stanbic IBTC Pension",
        provider: "Stanbic IBTC Pension",
        value: 28500000,
        currency: "NGN",
        liquidity: "LOW",
        riskClass: "MEDIUM",
        source: "MANUAL",
        verificationStatus: "ESTIMATED",
        confidence: 0.8,
        lastValuationDate: monthsAgo(2),
      },
      {
        userId: yomi.id,
        category: "INSURANCE",
        assetType: "life",
        name: "Life cover",
        provider: "Leadway",
        value: 0,
        currency: "NGN",
        liquidity: "ILLIQUID",
        source: "MANUAL",
        verificationStatus: "VERIFIED",
        confidence: 0.9,
        notes: "Sum assured ₦50m — protective, not an investable asset",
      },
    ],
  });

  await prisma.liability.createMany({
    data: [
      {
        userId: yomi.id,
        type: "MORTGAGE",
        name: "Abuja property mortgage",
        provider: "Access Bank",
        balance: 18500000,
        interestRate: 0.19,
        monthlyPayment: 420000,
        confidence: 0.9,
      },
    ],
  });

  await prisma.goal.createMany({
    data: [
      {
        userId: yomi.id,
        type: "RETIREMENT",
        name: "Retirement",
        targetAmount: 450000000,
        targetDate: new Date("2045-01-01"),
        existingAllocation: 28500000,
        monthlyContribution: 800000,
        priority: 1,
      },
      {
        userId: yomi.id,
        type: "EDUCATION",
        name: "Education",
        targetAmount: 80000000,
        targetDate: new Date("2032-09-01"),
        existingAllocation: 12000000,
        monthlyContribution: 400000,
        priority: 1,
      },
      {
        userId: yomi.id,
        type: "PROPERTY",
        name: "Property",
        targetAmount: 40000000,
        targetDate: new Date("2029-06-01"),
        existingAllocation: 8000000,
        monthlyContribution: 250000,
        priority: 2,
      },
      {
        userId: yomi.id,
        type: "EMERGENCY",
        name: "Emergency reserve",
        targetAmount: 9000000,
        targetDate: new Date("2026-12-01"),
        existingAllocation: 7450000,
        monthlyContribution: 200000,
        priority: 1,
      },
    ],
  });

  await prisma.consent.createMany({
    data: [
      {
        userId: yomi.id,
        serviceName: "GTBank Open Banking (demo)",
        dataUsed: "Account balance",
        purpose: "Net worth & cash visibility",
        status: "ACTIVE",
        lastAccessAt: new Date(),
      },
      {
        userId: yomi.id,
        serviceName: "WealthAI analysis",
        dataUsed: "Wealth Graph, goals, risk profile",
        purpose: "Personalised diagnosis and recommendations",
        status: "ACTIVE",
      },
    ],
  });

  await prisma.memoryEntry.createMany({
    data: [
      {
        userId: yomi.id,
        category: "preference",
        content: "Prefers not to increase property exposure",
        source: "conversation",
        verified: true,
      },
      {
        userId: yomi.id,
        category: "protection",
        content: "Has employer health insurance",
        source: "fact-find",
        verified: true,
      },
      {
        userId: yomi.id,
        category: "estate",
        content: "Spouse listed as primary beneficiary on RSA",
        source: "fact-find",
        verified: false,
      },
    ],
  });

  await prisma.wealthSnapshot.createMany({
    data: [
      {
        userId: yomi.id,
        netWorthNgn: 182600000,
        confidence: 0.8,
        healthScore: 64,
        createdAt: monthsAgo(1),
      },
      {
        userId: yomi.id,
        netWorthNgn: 186400000,
        confidence: 0.82,
        healthScore: 67,
        createdAt: new Date(),
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: yomi.id,
        category: "Important",
        title: "Liquidity below target",
        body: "Emergency coverage is under 3 months of expenses.",
      },
      {
        userId: yomi.id,
        category: "Advisory",
        title: "Stale property valuations",
        body: "Two property estimates are over 6 months old.",
      },
    ],
  });

  // Persona B — Entrepreneur
  const amaka = await prisma.user.create({
    data: {
      email: "amaka@demo.wealthos.ng",
      passwordHash,
      name: "Amaka Okonkwo",
      role: "CUSTOMER",
      employmentStatus: "Business owner",
      riskTolerance: "growth",
      investmentExperience: "experienced",
      liquidityNeeds: "high",
      profileCompleteness: 70,
      dateOfBirth: new Date("1978-11-03"),
    },
  });

  await prisma.riskProfile.create({
    data: {
      userId: amaka.id,
      riskTolerance: "growth",
      capacityForLoss: "medium",
      investmentHorizon: "7",
      knowledgeLevel: "experienced",
    },
  });

  await prisma.income.create({
    data: {
      userId: amaka.id,
      type: "business",
      label: "Business drawings (irregular)",
      amount: 3500000,
      frequency: "monthly",
    },
  });
  await prisma.expense.create({
    data: {
      userId: amaka.id,
      category: "housing",
      label: "Household & staff",
      amount: 2200000,
      frequency: "monthly",
    },
  });

  await prisma.asset.createMany({
    data: [
      {
        userId: amaka.id,
        category: "CASH",
        assetType: "bank",
        name: "Business operating overflow",
        value: 12000000,
        currency: "NGN",
        liquidity: "HIGH",
        source: "MANUAL",
        verificationStatus: "ESTIMATED",
        confidence: 0.7,
      },
      {
        userId: amaka.id,
        category: "BUSINESS",
        assetType: "private_business",
        name: "Logistics company (60% ownership)",
        value: 180000000,
        ownershipPercent: 60,
        currency: "NGN",
        liquidity: "ILLIQUID",
        riskClass: "HIGH",
        source: "MANUAL",
        verificationStatus: "ESTIMATED",
        confidence: 0.55,
        lastValuationDate: monthsAgo(10),
      },
      {
        userId: amaka.id,
        category: "PROPERTY",
        assetType: "commercial",
        name: "Warehouse — Ikeja",
        value: 120000000,
        currency: "NGN",
        liquidity: "ILLIQUID",
        riskClass: "MEDIUM",
        source: "MANUAL",
        verificationStatus: "ESTIMATED",
        confidence: 0.6,
        lastValuationDate: monthsAgo(9),
      },
    ],
  });

  await prisma.liability.create({
    data: {
      userId: amaka.id,
      type: "BUSINESS_LOAN",
      name: "Working capital facility",
      balance: 45000000,
      interestRate: 0.28,
      monthlyPayment: 1500000,
    },
  });

  await prisma.goal.create({
    data: {
      userId: amaka.id,
      type: "BUSINESS_CAPITAL",
      name: "Business capital buffer",
      targetAmount: 50000000,
      targetDate: new Date("2027-12-01"),
      existingAllocation: 12000000,
      monthlyContribution: 500000,
    },
  });

  // Persona C — Diaspora
  const chioma = await prisma.user.create({
    data: {
      email: "chioma@demo.wealthos.ng",
      passwordHash,
      name: "Chioma Eze",
      role: "CUSTOMER",
      employmentStatus: "Employed abroad",
      riskTolerance: "balanced",
      investmentExperience: "intermediate",
      liquidityNeeds: "medium",
      profileCompleteness: 75,
      baseCurrency: "NGN",
      dateOfBirth: new Date("1986-02-20"),
    },
  });

  await prisma.riskProfile.create({
    data: {
      userId: chioma.id,
      riskTolerance: "balanced",
      capacityForLoss: "medium",
      investmentHorizon: "12",
      knowledgeLevel: "intermediate",
    },
  });

  await prisma.income.create({
    data: {
      userId: chioma.id,
      type: "foreign",
      label: "UK salary",
      amount: 6500,
      currency: "GBP",
      frequency: "monthly",
    },
  });
  await prisma.expense.createMany({
    data: [
      {
        userId: chioma.id,
        category: "housing",
        label: "UK rent & living",
        amount: 2800,
        currency: "GBP",
        frequency: "monthly",
      },
      {
        userId: chioma.id,
        category: "family",
        label: "Nigeria family support",
        amount: 800000,
        currency: "NGN",
        frequency: "monthly",
      },
    ],
  });

  await prisma.asset.createMany({
    data: [
      {
        userId: chioma.id,
        category: "CASH",
        assetType: "bank",
        name: "UK current account",
        value: 18000,
        currency: "GBP",
        liquidity: "HIGH",
        source: "MANUAL",
        verificationStatus: "ESTIMATED",
        confidence: 0.85,
      },
      {
        userId: chioma.id,
        category: "PENSION",
        assetType: "uk_pension",
        name: "UK workplace pension",
        value: 95000,
        currency: "GBP",
        liquidity: "LOW",
        riskClass: "MEDIUM",
        source: "MANUAL",
        verificationStatus: "ESTIMATED",
        confidence: 0.75,
      },
      {
        userId: chioma.id,
        category: "PROPERTY",
        assetType: "residential",
        name: "Enugu family home",
        value: 45000000,
        currency: "NGN",
        liquidity: "ILLIQUID",
        source: "MANUAL",
        verificationStatus: "ESTIMATED",
        confidence: 0.6,
        lastValuationDate: monthsAgo(6),
      },
      {
        userId: chioma.id,
        category: "CRYPTO",
        assetType: "crypto",
        name: "BTC self-custody estimate",
        provider: "Self",
        value: 2500,
        currency: "USD",
        liquidity: "MEDIUM",
        riskClass: "VERY_HIGH",
        source: "MANUAL",
        verificationStatus: "ESTIMATED",
        confidence: 0.5,
        lastValuationDate: monthsAgo(2),
        notes: "Awareness only — WealthOS does not trade crypto",
      },
      {
        userId: chioma.id,
        category: "INVESTMENT",
        assetType: "usd_etf",
        name: "USD global ETF portfolio",
        value: 48000,
        currency: "USD",
        liquidity: "HIGH",
        riskClass: "MEDIUM",
        source: "MANUAL",
        verificationStatus: "VERIFIED",
        confidence: 0.88,
      },
    ],
  });

  await prisma.goal.create({
    data: {
      userId: chioma.id,
      type: "MIGRATION",
      name: "Nigeria home upgrade",
      targetAmount: 70000000,
      currency: "NGN",
      targetDate: new Date("2030-01-01"),
      existingAllocation: 45000000,
      monthlyContribution: 500,
      // monthlyContribution stored in goal currency ambiguity — demo uses NGN target
    },
  });

  // Adviser + Admin
  const adviser = await prisma.user.create({
    data: {
      email: "adviser@demo.wealthos.ng",
      passwordHash,
      name: "Ngozi Adeyemi",
      role: "ADVISER",
      profileCompleteness: 100,
    },
  });

  await prisma.user.create({
    data: {
      email: "admin@demo.wealthos.ng",
      passwordHash,
      name: "Ops Admin",
      role: "ADMIN",
      profileCompleteness: 100,
    },
  });

  await prisma.user.create({
    data: {
      email: "checker@demo.wealthos.ng",
      passwordHash,
      name: "Ops Checker",
      role: "ADMIN",
      profileCompleteness: 100,
    },
  });

  // Connection health demos for Persona A
  const gtConsent = await prisma.consent.findFirst({
    where: { userId: yomi.id, serviceName: { contains: "GTBank" } },
  });
  await prisma.connection.createMany({
    data: [
      {
        userId: yomi.id,
        providerName: "GTBank Open Banking (demo)",
        kind: "open_banking",
        status: "healthy",
        lastSyncAt: new Date(),
        consentId: gtConsent?.id,
      },
      {
        userId: yomi.id,
        providerName: "ARM fund positions (demo)",
        kind: "asset_manager",
        status: "degraded",
        lastSyncAt: monthsAgo(0),
        lastError: "Provider timeout — using last known balance",
      },
    ],
  });

  await prisma.notificationPreference.createMany({
    data: [
      { userId: yomi.id },
      { userId: amaka.id },
      { userId: chioma.id },
    ],
  });

  await prisma.lifeEvent.create({
    data: {
      userId: yomi.id,
      type: "job_change",
      label: "Promoted to executive role",
      date: new Date("2024-03-01"),
      notes: "Higher income; education goals became more urgent.",
    },
  });

  await prisma.estateItem.createMany({
    data: [
      {
        userId: yomi.id,
        kind: "will",
        label: "Family will (solicitor draft)",
        status: "draft",
        notes: "With family solicitor — not yet signed",
      },
      {
        userId: yomi.id,
        kind: "beneficiaries",
        label: "RSA primary beneficiary — spouse",
        status: "documented",
      },
      {
        userId: amaka.id,
        kind: "succession",
        label: "Logistics company succession note",
        status: "missing",
        notes: "Need share-transfer intentions documented",
      },
      {
        userId: chioma.id,
        kind: "will",
        label: "Cross-border will",
        status: "missing",
      },
    ],
  });

  await prisma.adviserCustomer.createMany({
    data: [
      { adviserId: adviser.id, customerId: yomi.id },
      { adviserId: adviser.id, customerId: amaka.id },
      { adviserId: adviser.id, customerId: chioma.id },
    ],
  });

  await prisma.adviserNote.createMany({
    data: [
      {
        adviserId: adviser.id,
        customerId: yomi.id,
        kind: "plan_action",
        title: "Refresh property valuations before Q4 review",
        body: "Please update Lekki and Abuja estimates so concentration and LTV stay trustworthy. Shared for your Wealth Inbox.",
        sharedWithCustomer: true,
        status: "open",
      },
      {
        adviserId: adviser.id,
        customerId: yomi.id,
        kind: "note",
        title: "Internal: education goal urgency",
        body: "Client prioritises school fees over further property. Do not push property products.",
        sharedWithCustomer: false,
        status: "open",
      },
      {
        adviserId: adviser.id,
        customerId: amaka.id,
        kind: "call_summary",
        title: "Call summary — working capital vs personal buffer",
        body: "Agreed to separate personal emergency cash from business overflow before new facilities.",
        sharedWithCustomer: true,
        status: "open",
      },
    ],
  });

  const yomiCareAck = await prisma.adviserNote.create({
    data: {
      adviserId: adviser.id,
      customerId: yomi.id,
      kind: "care_ack",
      title: "Adviser acknowledged your support case",
      body: [
        `${adviser.name} acknowledged an open support case for ${yomi.name}.`,
        "Item: Open support case",
        "I've seen your support note — thank you for raising it. Ops still owns formal resolution.",
        "This does not close the ops queue — admin resolution still applies where needed.",
      ].join("\n\n"),
      sharedWithCustomer: true,
      status: "open",
    },
  });

  await prisma.inboxItem.create({
    data: {
      userId: yomi.id,
      category: "adviser",
      priority: "important",
      title: "Care update · support case",
      body: `${adviser.name}: I've seen your support note — thank you for raising it.`,
      href: "/app/support",
      sourceType: "care_ack",
      sourceId: yomiCareAck.id,
      status: "unread",
    },
  });

  await prisma.notification.create({
    data: {
      userId: yomi.id,
      category: "important",
      title: yomiCareAck.title,
      body: `${adviser.name}: I've seen your support note — thank you for raising it.`,
    },
  });

  console.log("Seed complete.");
  console.log("Demo logins (password: WealthOSdemo1!):");
  console.log("  yomi@demo.wealthos.ng — Persona A executive");
  console.log("  amaka@demo.wealthos.ng — Persona B entrepreneur");
  console.log("  chioma@demo.wealthos.ng — Persona C diaspora");
  console.log("  adviser@demo.wealthos.ng — Adviser portal");
  console.log("  admin@demo.wealthos.ng — Admin portal (maker)");
  console.log("  checker@demo.wealthos.ng — Admin portal (checker)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
