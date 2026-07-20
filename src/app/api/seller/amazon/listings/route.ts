import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encrypt";
import { getLWAAccessToken, getSellerListings } from "@/lib/amazon-sp";

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
      return NextResponse.json({ error: "Amazon account not connected" }, { status: 400 });
    }

    const creds = account.credentials as {
      sellerId:      string;
      marketplaceId: string;
      region:        string;
      refreshToken:  string;
    };

    const region      = (creds.region ?? "eu") as "eu" | "na" | "fe";
    const accessToken = await getLWAAccessToken(decrypt(creds.refreshToken));
    const listings    = await getSellerListings(accessToken, creds.sellerId, creds.marketplaceId, region);

    return NextResponse.json({ listings });
  } catch (err) {
    console.error("[amazon/listings]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
