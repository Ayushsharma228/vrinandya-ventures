import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getRouteSession(req);
    if (!session || !["SELLER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const urlSellerId = req.nextUrl.searchParams.get("sellerId");
    const sellerId = session.user.role === "ADMIN" && urlSellerId ? urlSellerId : session.user.id;

    const account = await prisma.marketplaceAccount.findUnique({
      where: { sellerId_platform: { sellerId, platform: "AMAZON" } },
    });

    if (!account || !account.isActive) {
      return NextResponse.json({ connected: false });
    }

    const creds = account.credentials as {
      sellerId?:           string;
      marketplaceId?:      string;
      marketplaceCountry?: string;
      region?:             string;
      connectedAt?:        string;
      lastSyncAt?:         string | null;
    };

    const orderCount = await prisma.order.count({
      where: { sellerId, source: "AMAZON" },
    });

    const recentOrders = await prisma.order.findMany({
      where:   { sellerId, source: "AMAZON" },
      orderBy: { createdAt: "desc" },
      take:    5,
      include: { items: true },
    });

    return NextResponse.json({
      connected:           true,
      amazonSellerId:      creds.sellerId,
      marketplaceId:       creds.marketplaceId,
      marketplaceCountry:  creds.marketplaceCountry,
      connectedAt:         creds.connectedAt,
      lastSyncAt:          creds.lastSyncAt,
      orderCount,
      recentOrders,
    });
  } catch (err) {
    console.error("[amazon/status]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
