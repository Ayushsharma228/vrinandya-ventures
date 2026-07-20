import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getRouteSession(req);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await prisma.marketplaceAccount.findMany({
      where:   { platform: "AMAZON" },
      include: { seller: { select: { id: true, name: true, email: true, brandName: true } } },
      orderBy: { createdAt: "desc" },
    });

    const result = await Promise.all(
      accounts.map(async (acc) => {
        const orderCount = await prisma.order.count({
          where: { sellerId: acc.sellerId, source: "AMAZON" },
        });
        const creds = acc.credentials as {
          sellerId?:          string;
          marketplaceCountry?: string;
          connectedAt?:       string;
          lastSyncAt?:        string | null;
        };
        return {
          id:                 acc.id,
          sellerId:           acc.sellerId,
          sellerName:         acc.seller.name,
          sellerEmail:        acc.seller.email,
          brandName:          acc.seller.brandName,
          amazonSellerId:     creds.sellerId,
          marketplaceCountry: creds.marketplaceCountry,
          connectedAt:        creds.connectedAt,
          lastSyncAt:         creds.lastSyncAt,
          isActive:           acc.isActive,
          orderCount,
        };
      })
    );

    const totalAmazonOrders = await prisma.order.count({ where: { source: "AMAZON" } });

    return NextResponse.json({ accounts: result, totalAmazonOrders });
  } catch (err) {
    console.error("[admin/amazon]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
