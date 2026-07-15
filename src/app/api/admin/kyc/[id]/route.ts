import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

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

  await prisma.user.update({
    where: { id },
    data:  { kycStatus: action as never },
  });

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

  return NextResponse.json({ ok: true });
}
