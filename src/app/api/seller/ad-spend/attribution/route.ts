import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sellerId = session.user.id;
  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from");
  const to   = searchParams.get("to");

  const defaultFrom = new Date();
  defaultFrom.setDate(defaultFrom.getDate() - 30);

  const dateGte = from ? new Date(from) : defaultFrom;
  const dateLte = to   ? new Date(to + "T23:59:59") : new Date();

  // All ad spend rows in range, grouped by campaign
  const spendRows = await prisma.adSpend.findMany({
    where: { sellerId, date: { gte: dateGte, lte: dateLte } },
    select: { campaignId: true, campaignName: true, amount: true, date: true },
  });

  // All orders in range that have a utmCampaign (came from an ad)
  const orders = await prisma.order.findMany({
    where: {
      sellerId,
      createdAt: { gte: dateGte, lte: dateLte },
      utmCampaign: { not: null },
      status: { notIn: ["CANCELLED"] },
    },
    select: {
      id: true, totalAmount: true, status: true, utmCampaign: true, utmSource: true,
      items: { select: { name: true, quantity: true, price: true, productId: true } },
    },
  });

  // Build per-campaign spend map
  interface CampaignData {
    campaignId: string | null;
    campaignName: string;
    totalSpend: number;
    orderCount: number;
    revenue: number;
    rtoCount: number;
    products: Record<string, { name: string; quantity: number; revenue: number }>;
  }

  const campaignMap: Record<string, CampaignData> = {};

  // Index spend by campaign name (lowercase for matching)
  for (const row of spendRows) {
    const key = (row.campaignName ?? row.campaignId ?? "unknown").toLowerCase();
    if (!campaignMap[key]) {
      campaignMap[key] = {
        campaignId: row.campaignId,
        campaignName: row.campaignName ?? row.campaignId ?? "Unknown Campaign",
        totalSpend: 0,
        orderCount: 0,
        revenue: 0,
        rtoCount: 0,
        products: {},
      };
    }
    campaignMap[key].totalSpend += row.amount;
  }

  // Match orders to campaigns by utmCampaign name
  for (const order of orders) {
    const utmKey = (order.utmCampaign ?? "").toLowerCase();
    // Try exact match first, then partial match
    let matched = campaignMap[utmKey];
    if (!matched) {
      const foundKey = Object.keys(campaignMap).find(
        (k) => k.includes(utmKey) || utmKey.includes(k)
      );
      if (foundKey) matched = campaignMap[foundKey];
    }

    // If no campaign match, bucket under the utm name directly
    if (!matched) {
      if (!campaignMap[utmKey]) {
        campaignMap[utmKey] = {
          campaignId: null,
          campaignName: order.utmCampaign ?? "Unknown",
          totalSpend: 0,
          orderCount: 0,
          revenue: 0,
          rtoCount: 0,
          products: {},
        };
      }
      matched = campaignMap[utmKey];
    }

    matched.orderCount += 1;
    if (order.status === "RTO") {
      matched.rtoCount += 1;
    } else {
      matched.revenue += order.totalAmount;
    }

    // Per-product breakdown
    for (const item of order.items) {
      const pKey = item.name;
      if (!matched.products[pKey]) {
        matched.products[pKey] = { name: item.name, quantity: 0, revenue: 0 };
      }
      matched.products[pKey].quantity += item.quantity;
      if (order.status !== "RTO") matched.products[pKey].revenue += item.price * item.quantity;
    }
  }

  // Shape output — sort by spend desc
  const campaigns = Object.values(campaignMap)
    .map((c) => ({
      campaignId:   c.campaignId,
      campaignName: c.campaignName,
      totalSpend:   Math.round(c.totalSpend * 100) / 100,
      orderCount:   c.orderCount,
      revenue:      Math.round(c.revenue * 100) / 100,
      rtoCount:     c.rtoCount,
      roas:         c.totalSpend > 0 ? Math.round((c.revenue / c.totalSpend) * 100) / 100 : null,
      cpa:          c.orderCount > 0 ? Math.round((c.totalSpend / c.orderCount) * 100) / 100 : null,
      products:     Object.values(c.products).sort((a, b) => b.revenue - a.revenue),
    }))
    .sort((a, b) => b.totalSpend - a.totalSpend);

  // Summary
  const totalSpend   = campaigns.reduce((s, c) => s + c.totalSpend, 0);
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
  const totalOrders  = campaigns.reduce((s, c) => s + c.orderCount, 0);
  const overallRoas  = totalSpend > 0 ? Math.round((totalRevenue / totalSpend) * 100) / 100 : null;

  return NextResponse.json({ campaigns, summary: { totalSpend, totalRevenue, totalOrders, overallRoas } });
}
