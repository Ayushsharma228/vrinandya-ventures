import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const EVENTS = {
  ACCOUNT_CREATED:  "ACCOUNT_CREATED",
  AGREEMENT_SIGNED: "AGREEMENT_SIGNED",
  KYC_SUBMITTED:    "KYC_SUBMITTED",
  KYC_APPROVED:     "KYC_APPROVED",
  KYC_REJECTED:     "KYC_REJECTED",
  BANK_SAVED:       "BANK_SAVED",
  SHOPIFY_CONNECTED:"SHOPIFY_CONNECTED",
  PRODUCTS_IMPORTED:"PRODUCTS_IMPORTED",
  LISTING_REQUESTED:"LISTING_REQUESTED",
  LISTING_LIVE:     "LISTING_LIVE",
  FIRST_ORDER:      "FIRST_ORDER",
  FIRST_DELIVERY:   "FIRST_DELIVERY",
  WALLET_ACTIVE:    "WALLET_ACTIVE",
  ACTIVATED:        "SELLER_ACTIVATED",
  STALLED:          "STALLED",
  AI_NOTE:          "AI_NOTE",
} as const;

export async function logTimeline(
  activationId: string,
  event: string,
  description: string,
  metadata?: unknown,
): Promise<void> {
  await prisma.sellerTimeline.create({
    data: {
      activationId,
      event,
      description,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
    },
  });
}

export async function logTimelineForSeller(
  sellerId: string,
  event: string,
  description: string,
  metadata?: unknown,
): Promise<void> {
  const activation = await prisma.sellerActivation.findUnique({ where: { sellerId } });
  if (!activation) return;
  await logTimeline(activation.id, event, description, metadata);
}
