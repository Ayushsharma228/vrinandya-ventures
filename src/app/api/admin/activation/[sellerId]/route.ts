import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { updateActivation, ensureSellerActivation } from "@/lib/activation/engine";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sellerId: string }> },
) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sellerId } = await params;

  // Verify seller exists
  const sellerUser = await prisma.user.findUnique({ where: { id: sellerId }, select: { id: true, role: true } });
  if (!sellerUser) return NextResponse.json({ error: "Seller not found" }, { status: 404 });

  // Ensure activation record exists and is up to date
  try {
    await ensureSellerActivation(sellerId);
    await updateActivation(sellerId);
  } catch {}

  const [activation, seller, timeline] = await Promise.all([
    prisma.sellerActivation.findUnique({ where: { sellerId } }),
    prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        id: true, name: true, email: true, phone: true, brandName: true,
        businessName: true, gstNumber: true, kycStatus: true, accountStatus: true,
        agreementAccepted: true, onboardingDone: true, createdAt: true,
        shopifyStore: { select: { storeName: true, createdAt: true } },
        _count: { select: { orders: true, listingRequests: true, walletTransactions: true } },
      },
    }),
    prisma.sellerTimeline.findMany({
      where:   { activation: { sellerId } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return NextResponse.json({ activation, seller, timeline });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sellerId: string }> },
) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sellerId } = await params;
  await ensureSellerActivation(sellerId);
  await updateActivation(sellerId);

  const activation = await prisma.sellerActivation.findUnique({ where: { sellerId } });
  return NextResponse.json({ activation, message: "Activation refreshed" });
}
