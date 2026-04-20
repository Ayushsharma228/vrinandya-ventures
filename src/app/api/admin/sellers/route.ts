import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest)() {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sellers = await prisma.user.findMany({
    where: { role: "SELLER" },
    select: {
      id: true, name: true, email: true, username: true, brandName: true,
      accountStatus: true, plan: true, planTier: true,
      paymentReference: true, paymentConfirmed: true,
      onboardingDone: true, kycStatus: true,
      aadhaarDocUrl: true, phone: true, businessName: true,
      dataStartDate: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ sellers });
}

export async function POST(req: NextRequest)(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sellerId, action } = await req.json();
  if (!sellerId) return NextResponse.json({ error: "sellerId required" }, { status: 400 });

  if (action === "activate") {
    await prisma.user.update({
      where: { id: sellerId },
      data: { accountStatus: "ACTIVE", paymentConfirmed: true },
    });
    return NextResponse.json({ success: true });
  }

  if (action === "suspend") {
    await prisma.user.update({
      where: { id: sellerId },
      data: { accountStatus: "SUSPENDED" },
    });
    return NextResponse.json({ success: true });
  }

  if (action === "reject") {
    await prisma.user.update({
      where: { id: sellerId },
      data: { accountStatus: "SUSPENDED", paymentConfirmed: false },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function PATCH(req: NextRequest)(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sellerId, dataStartDate } = await req.json();
  if (!sellerId) return NextResponse.json({ error: "sellerId required" }, { status: 400 });

  await prisma.user.update({
    where: { id: sellerId },
    data: { dataStartDate: dataStartDate ? new Date(dataStartDate) : null },
  });

  return NextResponse.json({ success: true });
}
