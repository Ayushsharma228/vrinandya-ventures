import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { emailKycApproved, emailKycRejected } from "@/lib/email";
import { dispatchEvent } from "@/lib/automation/engine";
import { ensureSellerActivation, updateActivation } from "@/lib/activation/engine";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id }    = await params;
  const { action, adminNote } = await req.json();

  if (!["APPROVED", "REJECTED"].includes(action))
    return NextResponse.json({ error: "action must be APPROVED or REJECTED" }, { status: 400 });

  const seller = await prisma.user.update({
    where: { id },
    data:  { kycStatus: action as never },
    select: { name: true, email: true },
  });

  if (action === "APPROVED") {
    emailKycApproved({ to: seller.email, name: seller.name ?? "Seller" }).catch(() => {});
  } else {
    emailKycRejected({
      to: seller.email,
      name: seller.name ?? "Seller",
      reason: adminNote ?? "Please resubmit with valid documents.",
    }).catch(() => {});
  }

  // Notify seller
  await prisma.notification.create({
    data: {
      userId:  id,
      type:    "GENERAL",
      title:   action === "APPROVED" ? "KYC Approved ✓" : "KYC Rejected",
      message: action === "APPROVED"
        ? "Your KYC has been verified. You are now eligible for full payout."
        : `Your KYC was rejected. Reason: ${adminNote ?? "Please resubmit with valid documents."}`,
      data: { action, adminNote },
    },
  });

  dispatchEvent({ type: action === "APPROVED" ? "KYC_APPROVED" : "KYC_REJECTED",
                  entityId: id, entityType: "SELLER",
                  payload: { sellerId: id, action }, actorId: session.user.id });

  if (action === "APPROVED") {
    setImmediate(async () => {
      try {
        await ensureSellerActivation(id);
        await updateActivation(id);
      } catch {}
    });
  }

  return NextResponse.json({ ok: true });
}
