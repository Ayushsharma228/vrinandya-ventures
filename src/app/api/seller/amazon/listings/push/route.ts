import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encrypt";
import { getLWAAccessToken, patchListingTitle } from "@/lib/amazon-sp";

export async function POST(req: NextRequest) {
  try {
    const session = await getRouteSession(req);
    if (!session || !["SELLER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sku, newTitle, productType } = await req.json() as {
      sku: string; newTitle: string; productType?: string;
    };

    if (!sku || !newTitle) {
      return NextResponse.json({ error: "sku and newTitle are required" }, { status: 400 });
    }

    const sellerId = session.user.id;
    const account  = await prisma.marketplaceAccount.findUnique({
      where: { sellerId_platform: { sellerId, platform: "AMAZON" } },
    });
    if (!account || !account.isActive) {
      return NextResponse.json({ error: "Amazon account not connected" }, { status: 400 });
    }

    const creds = account.credentials as {
      sellerId: string; marketplaceId: string; region: string; refreshToken: string;
    };

    const region      = (creds.region ?? "eu") as "eu" | "na" | "fe";
    const accessToken = await getLWAAccessToken(decrypt(creds.refreshToken));

    const result = await patchListingTitle(
      accessToken,
      creds.sellerId,
      sku,
      productType ?? "PRODUCT",
      newTitle,
      creds.marketplaceId,
      region,
    );

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[listings/push]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
