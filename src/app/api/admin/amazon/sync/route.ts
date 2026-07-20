import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encrypt";
import {
  getLWAAccessToken,
  getAmazonOrders,
  getOrderItems,
  mapAmazonStatus,
} from "@/lib/amazon-sp";
import { OrderStatus, Prisma } from "@prisma/client";

const DELAY_MS = 300;
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function syncSeller(sellerId: string) {
  const account = await prisma.marketplaceAccount.findUnique({
    where: { sellerId_platform: { sellerId, platform: "AMAZON" } },
  });
  if (!account || !account.isActive) return { created: 0, updated: 0, errors: 0 };

  const creds = account.credentials as {
    sellerId:      string;
    marketplaceId: string;
    region:        string;
    refreshToken:  string;
  };

  const region        = (creds.region ?? "eu") as "eu" | "na" | "fe";
  const accessToken   = await getLWAAccessToken(decrypt(creds.refreshToken));
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  let created = 0, updated = 0, errors = 0, nextToken: string | undefined;

  do {
    const { orders, nextToken: nt } = await getAmazonOrders(
      accessToken, creds.marketplaceId, region, thirtyDaysAgo, nextToken
    );
    nextToken = nt;

    for (const order of orders) {
      try {
        await sleep(DELAY_MS);
        const items  = await getOrderItems(accessToken, order.AmazonOrderId, region);
        const addr   = order.ShippingAddress;
        const buyer  = order.BuyerInfo;
        const status = mapAmazonStatus(order.OrderStatus) as OrderStatus;
        const total  = parseFloat(order.OrderTotal?.Amount ?? "0");

        const existing = await prisma.order.findUnique({
          where: { sellerId_externalOrderId_source: { sellerId, externalOrderId: order.AmazonOrderId, source: "AMAZON" } },
        });

        if (existing) {
          await prisma.order.update({
            where: { id: existing.id },
            data:  { status, totalAmount: total },
          });
          updated++;
        } else {
          await prisma.order.create({
            data: {
              sellerId,
              externalOrderId: order.AmazonOrderId,
              source:          "AMAZON",
              status,
              totalAmount:     total,
              orderDate:       new Date(order.PurchaseDate),
              customerName:    buyer?.BuyerName  ?? null,
              customerEmail:   buyer?.BuyerEmail ?? null,
              customerAddress: addr ? {
                phone:   addr.Phone ?? "", address: addr.AddressLine1 ?? "",
                city:    addr.City  ?? "", state:   addr.StateOrRegion ?? "",
                pincode: addr.PostalCode ?? "",
              } : Prisma.JsonNull,
              rawData: order as object,
              items: { create: items.map((i) => ({
                name:     i.Title,
                sku:      i.SellerSKU ?? null,
                quantity: i.QuantityOrdered,
                price:    parseFloat(i.ItemPrice?.Amount ?? "0"),
              })) },
            },
          });
          created++;
        }
      } catch (err) {
        console.error(`[admin/amazon/sync] ${order.AmazonOrderId}:`, err);
        errors++;
      }
    }
  } while (nextToken);

  const current = account.credentials as Record<string, unknown>;
  await prisma.marketplaceAccount.update({
    where: { id: account.id },
    data:  { credentials: { ...current, lastSyncAt: new Date().toISOString() } },
  });

  return { created, updated, errors };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getRouteSession(req);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({})) as { sellerId?: string; all?: boolean };

    if (body.all) {
      const accounts = await prisma.marketplaceAccount.findMany({
        where: { platform: "AMAZON", isActive: true },
      });
      const results = await Promise.all(
        accounts.map(async (acc) => {
          const r = await syncSeller(acc.sellerId).catch((e) => ({ error: String(e), created: 0, updated: 0, errors: 1 }));
          return { sellerId: acc.sellerId, ...r };
        })
      );
      return NextResponse.json({ ok: true, results });
    }

    if (!body.sellerId) return NextResponse.json({ error: "sellerId required" }, { status: 400 });
    const result = await syncSeller(body.sellerId);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[admin/amazon/sync]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
