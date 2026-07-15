import { prisma } from "@/lib/prisma";
import { AITaskSource, AITaskStatus, Prisma } from "@prisma/client";
import type { SellerActivation } from "@prisma/client";

interface Flags {
  kycApproved: boolean;
  shopifyConnected: boolean;
  productsImported: boolean;
  firstListingLive: boolean;
  firstOrderReceived: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

async function daysSince(date: Date): Promise<number> {
  return Math.floor((Date.now() - date.getTime()) / DAY_MS);
}

async function notifySeller(sellerId: string, title: string, message: string) {
  await prisma.notification.create({
    data: { userId: sellerId, type: "GENERAL", title, message },
  });
}

async function notifyAdmins(title: string, message: string, data?: unknown) {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id, type: "GENERAL", title, message,
        data: data as Prisma.InputJsonValue,
      },
    });
  }
}

async function enqueueAryaTask(
  sellerId: string,
  type: string,
  title: string,
  input: unknown,
) {
  const arya = await prisma.aIEmployee.findUnique({ where: { slug: "arya" } });
  if (!arya || !arya.isActive) return;

  const existing = await prisma.aITask.findFirst({
    where: { employeeId: arya.id, sourceId: sellerId, type, status: { in: [AITaskStatus.PENDING, AITaskStatus.PROCESSING] } },
  });
  if (existing) return;

  await prisma.aITask.create({
    data: {
      employeeId: arya.id,
      type,
      title,
      status:   AITaskStatus.PENDING,
      priority: 6,
      source:   AITaskSource.AUTOMATION_ENGINE,
      sourceId: sellerId,
      input:    input as Prisma.InputJsonValue,
    },
  });
}

export async function runActivationAutomation(
  sellerId: string,
  activation: SellerActivation,
  flags: Flags,
): Promise<void> {
  const regDays = await daysSince(activation.createdAt);

  // Rule 1: No Shopify after 3 days → Arya follow-up task
  if (!flags.shopifyConnected && regDays >= 3) {
    await enqueueAryaTask(
      sellerId,
      "seller.no_shopify",
      "Seller hasn't connected Shopify after 3 days",
      { sellerId, regDays, trigger: "no_shopify_stall" },
    );
  }

  // Rule 2: No products after 5 days post-Shopify → notify seller
  if (!flags.productsImported && flags.shopifyConnected && activation.shopifyAt) {
    const shopifyDays = await daysSince(activation.shopifyAt);
    if (shopifyDays >= 5) {
      await notifySeller(
        sellerId,
        "Import your first product",
        "Your Shopify store is connected! Next step: create a listing request to start selling. It only takes 5 minutes.",
      );
    }
  }

  // Rule 3: KYC pending > 1 day → notify seller
  if (!flags.kycApproved && regDays >= 1) {
    const seller = await prisma.user.findUnique({ where: { id: sellerId }, select: { kycStatus: true } });
    if (seller?.kycStatus === "NOT_SUBMITTED") {
      await notifySeller(
        sellerId,
        "Complete your KYC to start selling",
        "KYC verification is required before you can receive payouts. It takes just 2 minutes.",
      );
    }
  }

  // Rule 4: Listing requested but not live after 7 days → notify operations
  if (flags.productsImported && !flags.firstListingLive && activation.productsAt) {
    const productDays = await daysSince(activation.productsAt);
    if (productDays >= 7) {
      await notifyAdmins(
        "Seller Listing Pending >7 Days",
        `A seller's listing request has been pending for ${productDays} days. Please review and approve.`,
        { sellerId },
      );
    }
  }

  // Rule 5: No first order after listing live for 14 days → Arya note
  if (flags.firstListingLive && !flags.firstOrderReceived && activation.listingLiveAt) {
    const liveDays = await daysSince(activation.listingLiveAt);
    if (liveDays >= 14) {
      await enqueueAryaTask(
        sellerId,
        "seller.no_first_order",
        "Seller listing live 14 days but no first order",
        { sellerId, liveDays, trigger: "no_first_order" },
      );
    }
  }

  // Rule 6: Fully stalled (no activity) > 7 days with low activation → notify admin
  if (activation.activationPct < 40 && activation.lastActivityAt) {
    const staleDays = await daysSince(activation.lastActivityAt);
    if (staleDays >= 7) {
      await notifyAdmins(
        "Seller Activation Stalled",
        `A seller has not progressed in ${staleDays} days. Activation: ${activation.activationPct}%. Intervention may be needed.`,
        { sellerId, staleDays, activationPct: activation.activationPct },
      );
    }
  }
}
