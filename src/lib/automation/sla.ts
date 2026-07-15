import { prisma } from "@/lib/prisma";

// SLA deadlines in hours
const SLA_HOURS = {
  assignment:  4,   // Order must be assigned to supplier within 4h
  acceptance:  24,  // Supplier must accept within 24h of assignment
  packing:     48,  // Order must be packed within 48h of acceptance
  dispatch:    72,  // Order must be dispatched within 72h of packing
};

export async function startOrderSla(orderId: string) {
  const now = new Date();
  const assignmentDeadline = new Date(now.getTime() + SLA_HOURS.assignment * 3600000);

  try {
    await prisma.orderSla.upsert({
      where:  { orderId },
      create: { orderId, assignmentDeadline },
      update: { assignmentDeadline },
    });
  } catch { /* sla tracking is non-critical */ }
}

export async function recordSlaEvent(
  orderId: string,
  stage: "assigned" | "accepted" | "packed" | "dispatched" | "delivered"
) {
  const now = new Date();
  try {
    const sla = await prisma.orderSla.findUnique({ where: { orderId } });
    const data: Record<string, unknown> = {};

    if (stage === "assigned") {
      data.assignedAt         = now;
      data.acceptanceDeadline = new Date(now.getTime() + SLA_HOURS.acceptance * 3600000);
    } else if (stage === "accepted") {
      data.acceptedAt      = now;
      data.packingDeadline = new Date(now.getTime() + SLA_HOURS.packing * 3600000);
    } else if (stage === "packed") {
      data.packedAt         = now;
      data.dispatchDeadline = new Date(now.getTime() + SLA_HOURS.dispatch * 3600000);
    } else if (stage === "dispatched") {
      data.dispatchedAt = now;
    } else if (stage === "delivered") {
      data.deliveredAt = now;
    }

    // Check assignment breach
    if (stage === "assigned" && sla?.assignmentDeadline && now > sla.assignmentDeadline) {
      data.assignmentBreached = true;
    }
    // Check acceptance breach when accepting
    if (stage === "accepted" && sla?.acceptanceDeadline && now > sla.acceptanceDeadline) {
      data.acceptanceBreached = true;
    }

    if (sla) {
      await prisma.orderSla.update({ where: { orderId }, data });
    } else {
      await prisma.orderSla.create({ data: { orderId, ...data } });
    }
  } catch { /* non-critical */ }
}

export async function checkSlaBreaches() {
  const now = new Date();
  try {
    // Mark assignment breaches
    await prisma.orderSla.updateMany({
      where: {
        assignedAt:         null,
        assignmentDeadline: { lt: now },
        assignmentBreached: false,
      },
      data: { assignmentBreached: true },
    });

    // Mark acceptance breaches
    await prisma.orderSla.updateMany({
      where: {
        acceptedAt:         null,
        acceptanceDeadline: { lt: now },
        acceptanceBreached: false,
      },
      data: { acceptanceBreached: true },
    });
  } catch { /* non-critical */ }
}
