import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncShopifyOrders } from "@/app/api/seller/shopify/sync-orders/route";
import { syncForSeller as syncAmazonOrders } from "@/app/api/seller/amazon/sync-orders/route";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: { sellerId: string; shopify?: number | string; amazon?: number | string }[] = [];

  // All sellers with Shopify connected
  const shopifySellers = await prisma.shopifyStore.findMany({
    select: { sellerId: true },
  });

  // All sellers with Amazon connected
  const amazonSellers = await prisma.marketplaceAccount.findMany({
    where: { platform: "AMAZON", isActive: true },
    select: { sellerId: true },
  });

  const sellerIds = new Set([
    ...shopifySellers.map((s) => s.sellerId),
    ...amazonSellers.map((s) => s.sellerId),
  ]);

  for (const sellerId of sellerIds) {
    const row: (typeof results)[0] = { sellerId };

    const hasShopify = shopifySellers.some((s) => s.sellerId === sellerId);
    if (hasShopify) {
      try {
        row.shopify = await syncShopifyOrders(sellerId);
      } catch (err) {
        row.shopify = err instanceof Error ? err.message : "error";
      }
    }

    const hasAmazon = amazonSellers.some((s) => s.sellerId === sellerId);
    if (hasAmazon) {
      try {
        const r = await syncAmazonOrders(sellerId);
        row.amazon = r.created + r.updated;
      } catch (err) {
        row.amazon = err instanceof Error ? err.message : "error";
      }
    }

    results.push(row);
  }

  return NextResponse.json({ ok: true, processed: sellerIds.size, results });
}
