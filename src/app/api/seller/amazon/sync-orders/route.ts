import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encrypt";
import {
  getLWAAccessToken,
  getAmazonOrders,
  getOrderItems,
  mapAmazonStatus,
  MARKETPLACE_IDS,
} from "@/lib/amazon-sp";
import { OrderStatus, Prisma } from "@prisma/client";

const DELAY_MS = 300; // stay well within SP-API rate limits
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function syncForSeller(sellerId: string): Promise<{ created: number; updated: number; errors: number }> {
  const account = await prisma.marketplaceAccount.findUnique({
    where: { sellerId_platform: { sellerId, platform: "AMAZON" } },
  });
  if (!account || !account.isActive) throw new Error("No active Amazon account");

  const creds = account.credentials as {
    sellerId:      string;
    marketplaceId: string;
    region:        string;
    refreshToken:  string;
  };

  const region         = (creds.region ?? "eu") as "eu" | "na" | "fe";
  const accessToken    = await getLWAAccessToken(decrypt(creds.refreshToken));
  const thirtyDaysAgo  = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  let created = 0, updated = 0, errors = 0;
  let nextToken: string | undefined;

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

        const orderItems = items.map((i) => ({
          name:     i.Title,
          sku:      i.SellerSKU ?? null,
          quantity: i.QuantityOrdered,
          price:    parseFloat(i.ItemPrice?.Amount ?? "0"),
        }));

        const existing = await prisma.order.findUnique({
          where: { sellerId_externalOrderId_source: {
            sellerId, externalOrderId: order.AmazonOrderId, source: "AMAZON",
          }},
        });

        if (existing) {
          await prisma.order.update({
            where: { id: existing.id },
            data: {
              status,
              totalAmount:  total,
              customerName:  buyer?.BuyerName  ?? existing.customerName,
              customerEmail: buyer?.BuyerEmail ?? existing.customerEmail,
              ...(addr ? {
                customerAddress: {
                  phone:   addr.Phone         ?? "",
                  address: addr.AddressLine1  ?? "",
                  city:    addr.City          ?? "",
                  state:   addr.StateOrRegion ?? "",
                  pincode: addr.PostalCode    ?? "",
                },
              } : {}),
            },
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
              customerName:    buyer?.BuyerName  ?? null,
              customerEmail:   buyer?.BuyerEmail ?? null,
              customerAddress: addr ? {
                phone:   addr.Phone         ?? "",
                address: addr.AddressLine1  ?? "",
                city:    addr.City          ?? "",
                state:   addr.StateOrRegion ?? "",
                pincode: addr.PostalCode    ?? "",
              } : Prisma.JsonNull,
              rawData: order as object,
              items: {
                create: orderItems,
              },
            },
          });
          created++;
        }
      } catch (err) {
        console.error(`[amazon/sync] order ${order.AmazonOrderId}:`, err);
        errors++;
      }
    }
  } while (nextToken);

  // Update lastSyncAt in credentials
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
    if (!session || !["SELLER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin can pass a specific sellerId
    let targetSellerId = session.user.id;
    if (session.user.role === "ADMIN") {
      const body = await req.json().catch(() => ({})) as { sellerId?: string };
      if (body.sellerId) targetSellerId = body.sellerId;
    }

    const result = await syncForSeller(targetSellerId);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[amazon/sync-orders]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
