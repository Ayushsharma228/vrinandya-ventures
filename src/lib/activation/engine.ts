import { prisma } from "@/lib/prisma";
import { ActivationStage, Prisma } from "@prisma/client";
import { computeHealthScore } from "./health";
import { logTimeline, EVENTS } from "./timeline";
import { runActivationAutomation } from "./automation";

// ── Checklist weights (must sum to 100) ──────────────────────────────────────
const WEIGHTS = {
  accountCreated:      5,
  agreementSigned:     5,
  businessFilled:      5,
  bankFilled:          5,
  kycApproved:        10,
  shopifyConnected:   10,
  productsImported:   10,
  listingRequested:    5,
  firstListingLive:   15,
  firstOrderReceived: 15,
  firstOrderDelivered: 10,
  walletActive:        5,
} as const;

type ChecklistKey = keyof typeof WEIGHTS;

function deriveStage(flags: Record<ChecklistKey, boolean>): ActivationStage {
  if (flags.firstOrderDelivered) return ActivationStage.ACTIVATED;
  if (flags.firstOrderReceived)  return ActivationStage.FIRST_ORDER_RECEIVED;
  if (flags.firstListingLive)    return ActivationStage.FIRST_LISTING_LIVE;
  if (flags.listingRequested)    return ActivationStage.LISTING_REQUESTED;
  if (flags.productsImported)    return ActivationStage.PRODUCTS_IMPORTED;
  if (flags.shopifyConnected)    return ActivationStage.SHOPIFY_CONNECTED;
  if (flags.kycApproved)         return ActivationStage.KYC_APPROVED;
  if (flags.bankFilled)          return ActivationStage.BANK_VERIFIED;
  if (flags.agreementSigned)     return ActivationStage.AGREEMENT_SIGNED;
  return ActivationStage.ACCOUNT_CREATED;
}

function computeActivationPct(flags: Record<ChecklistKey, boolean>): number {
  let total = 0;
  for (const [key, weight] of Object.entries(WEIGHTS)) {
    if (flags[key as ChecklistKey]) total += weight;
  }
  return Math.min(100, total);
}

function estimateDays(flags: Record<ChecklistKey, boolean>): number {
  let days = 0;
  if (!flags.kycApproved)         days += 3;
  if (!flags.shopifyConnected)    days += 5;
  if (!flags.productsImported)    days += 3;
  if (!flags.firstListingLive)    days += 5;
  if (!flags.firstOrderReceived)  days += 14;
  if (!flags.firstOrderDelivered) days += 7;
  return days;
}

export async function ensureSellerActivation(sellerId: string): Promise<void> {
  await prisma.sellerActivation.upsert({
    where:  { sellerId },
    create: { sellerId },
    update: {},
  });
}

export async function updateActivation(sellerId: string): Promise<void> {
  // Load all relevant seller data in one go
  const seller = await prisma.user.findUnique({
    where:   { id: sellerId },
    include: {
      shopifyStore:       true,
      listingRequests:    { take: 1 },
      orders:             { where: { status: "DELIVERED" }, take: 1, select: { id: true, createdAt: true } },
      walletTransactions: { take: 1, select: { id: true } },
    },
  });
  if (!seller || seller.role !== "SELLER") return;

  // Live marketplace listing check
  const liveListingCount = await prisma.marketplaceListing.count({
    where: { listingRequest: { sellerId }, status: "LIVE" },
  });

  // Any order ever (not just delivered)
  const anyOrder = await prisma.order.findFirst({
    where:  { sellerId },
    select: { id: true, createdAt: true },
  });

  // Any delivered order
  const deliveredOrder = seller.orders[0] ?? null;

  // First listing request
  const firstListingReq = seller.listingRequests[0] ?? null;

  // Build checklist flags
  const flags: Record<ChecklistKey, boolean> = {
    accountCreated:      true,
    agreementSigned:     seller.agreementAccepted,
    businessFilled:      !!(seller.businessName && seller.businessAddress),
    bankFilled:          !!(seller.bankAccount && seller.bankHolder && seller.bankIfsc),
    kycApproved:         seller.kycStatus === "APPROVED",
    shopifyConnected:    !!seller.shopifyStore,
    productsImported:    seller.listingRequests.length > 0,
    listingRequested:    seller.listingRequests.length > 0,
    firstListingLive:    liveListingCount > 0,
    firstOrderReceived:  !!anyOrder,
    firstOrderDelivered: !!deliveredOrder,
    walletActive:        seller.walletTransactions.length > 0,
  };

  const activationPct  = computeActivationPct(flags);
  const currentStage   = deriveStage(flags);
  const { score, label } = computeHealthScore(seller, flags, liveListingCount, !!anyOrder);
  const estimatedDays  = estimateDays(flags);
  const isActivated    = currentStage === ActivationStage.ACTIVATED;

  // Load existing record to detect stage changes
  const existing = await prisma.sellerActivation.findUnique({ where: { sellerId } });

  const now = new Date();

  await prisma.sellerActivation.upsert({
    where:  { sellerId },
    create: {
      sellerId,
      currentStage,
      activationPct,
      healthScore:  score,
      healthLabel:  label,
      estimatedDays,
      lastActivityAt: now,
      ...(isActivated ? { activatedAt: now } : {}),
      ...flags,
      agreementAt:    seller.agreementAccepted ? (seller.agreementAcceptedAt ?? now) : null,
      kycApprovedAt:  flags.kycApproved ? now : null,
      shopifyAt:      flags.shopifyConnected ? now : null,
      productsAt:     flags.productsImported ? now : null,
      listingLiveAt:  flags.firstListingLive ? now : null,
      firstOrderAt:   anyOrder?.createdAt ?? null,
      firstDeliveryAt: deliveredOrder?.createdAt ?? null,
    },
    update: {
      currentStage,
      activationPct,
      healthScore:  score,
      healthLabel:  label,
      estimatedDays,
      lastActivityAt: now,
      ...(isActivated && !existing?.activatedAt ? { activatedAt: now } : {}),
      ...flags,
      agreementAt:    flags.agreementSigned ? (existing?.agreementAt ?? seller.agreementAcceptedAt ?? now) : null,
      kycApprovedAt:  flags.kycApproved    ? (existing?.kycApprovedAt ?? now) : null,
      shopifyAt:      flags.shopifyConnected ? (existing?.shopifyAt ?? now) : null,
      productsAt:     flags.productsImported ? (existing?.productsAt ?? now) : null,
      listingLiveAt:  flags.firstListingLive ? (existing?.listingLiveAt ?? now) : null,
      firstOrderAt:   anyOrder?.createdAt ?? null,
      firstDeliveryAt: deliveredOrder?.createdAt ?? null,
    },
  });

  const activation = await prisma.sellerActivation.findUnique({ where: { sellerId } });
  if (!activation) return;

  // Log timeline events when flags flip for the first time
  if (existing) {
    const changes: Array<{ flag: ChecklistKey; event: string; description: string }> = [
      { flag: "agreementSigned",    event: EVENTS.AGREEMENT_SIGNED,   description: "Seller accepted the agreement" },
      { flag: "kycApproved",        event: EVENTS.KYC_APPROVED,       description: "KYC was approved by admin" },
      { flag: "shopifyConnected",   event: EVENTS.SHOPIFY_CONNECTED,  description: "Shopify store connected" },
      { flag: "productsImported",   event: EVENTS.PRODUCTS_IMPORTED,  description: "First product imported / listing request created" },
      { flag: "firstListingLive",   event: EVENTS.LISTING_LIVE,       description: "First marketplace listing went live" },
      { flag: "firstOrderReceived", event: EVENTS.FIRST_ORDER,        description: "First order received" },
      { flag: "firstOrderDelivered",event: EVENTS.FIRST_DELIVERY,     description: "First order delivered successfully" },
      { flag: "walletActive",       event: EVENTS.WALLET_ACTIVE,      description: "Wallet received first transaction" },
    ];

    for (const { flag, event, description } of changes) {
      if (flags[flag] && !existing[flag]) {
        await logTimeline(activation.id, event, description);
      }
    }

    if (isActivated && !existing.activatedAt) {
      await logTimeline(activation.id, EVENTS.ACTIVATED, "🎉 Seller fully activated!");
    }
  }

  // Run automation checks (Arya tasks, stall notifications) — fire-and-forget
  setImmediate(() => {
    runActivationAutomation(sellerId, activation, flags).catch(() => {});
  });
}
