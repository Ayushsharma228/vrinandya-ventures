import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encrypt";
import { MARKETPLACE_IDS } from "@/lib/amazon-sp";

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sellerEmail, marketplace = "IN", refreshToken, sellingPartnerId = "" } = await req.json();

  if (!sellerEmail || !refreshToken) {
    return NextResponse.json({ error: "sellerEmail and refreshToken are required" }, { status: 400 });
  }

  const seller = await prisma.user.findUnique({ where: { email: sellerEmail } });
  if (!seller) {
    return NextResponse.json({ error: `No user found with email: ${sellerEmail}` }, { status: 404 });
  }

  const mkt = MARKETPLACE_IDS[marketplace] ?? MARKETPLACE_IDS.IN;
  const credentials = {
    sellerId:           sellingPartnerId,
    marketplaceId:      mkt.id,
    marketplaceCountry: marketplace,
    region:             mkt.region,
    refreshToken:       encrypt(refreshToken),
    connectedAt:        new Date().toISOString(),
    lastSyncAt:         null,
  };

  await prisma.marketplaceAccount.upsert({
    where:  { sellerId_platform: { sellerId: seller.id, platform: "AMAZON" } },
    create: { sellerId: seller.id, platform: "AMAZON", isActive: true, credentials },
    update: { isActive: true, credentials },
  });

  return NextResponse.json({ success: true, sellerId: seller.id, marketplace });
}
