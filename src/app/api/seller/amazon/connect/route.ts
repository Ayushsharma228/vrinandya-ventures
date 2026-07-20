import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encrypt";
import { testAmazonConnection, MARKETPLACE_IDS } from "@/lib/amazon-sp";

export async function POST(req: NextRequest) {
  try {
    const session = await getRouteSession(req);
    if (!session || !["SELLER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sellerId, marketplaceCountry, refreshToken, targetSellerId } = await req.json() as {
      sellerId:           string;
      marketplaceCountry: string;
      refreshToken:       string;
      targetSellerId?:    string;
    };

    if (!sellerId || !marketplaceCountry || !refreshToken) {
      return NextResponse.json({ error: "sellerId, marketplaceCountry, and refreshToken are required" }, { status: 400 });
    }

    const marketplace = MARKETPLACE_IDS[marketplaceCountry.toUpperCase()];
    if (!marketplace) {
      return NextResponse.json({ error: `Unknown marketplace: ${marketplaceCountry}` }, { status: 400 });
    }

    // Admin can connect on behalf of a seller
    const ownerId = session.user.role === "ADMIN" && targetSellerId ? targetSellerId : session.user.id;

    // Test the connection before saving
    const test = await testAmazonConnection(refreshToken, marketplace.id, marketplace.region);
    if (!test.ok) {
      return NextResponse.json({ error: `Connection test failed: ${test.error}` }, { status: 400 });
    }

    const encryptedToken = encrypt(refreshToken);
    await prisma.marketplaceAccount.upsert({
      where:  { sellerId_platform: { sellerId: ownerId, platform: "AMAZON" } },
      create: {
        sellerId:  ownerId,
        platform:  "AMAZON",
        isActive:  true,
        credentials: {
          sellerId:      sellerId,
          marketplaceId: marketplace.id,
          marketplaceCountry: marketplaceCountry.toUpperCase(),
          region:        marketplace.region,
          refreshToken:  encryptedToken,
          connectedAt:   new Date().toISOString(),
          lastSyncAt:    null,
        },
      },
      update: {
        isActive: true,
        credentials: {
          sellerId:      sellerId,
          marketplaceId: marketplace.id,
          marketplaceCountry: marketplaceCountry.toUpperCase(),
          region:        marketplace.region,
          refreshToken:  encryptedToken,
          connectedAt:   new Date().toISOString(),
          lastSyncAt:    null,
        },
      },
    });

    return NextResponse.json({ ok: true, orderCount: test.orderCount });
  } catch (err) {
    console.error("[amazon/connect]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
