import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { storeUrl, accessToken } = await req.json();
  if (!storeUrl || !accessToken) {
    return NextResponse.json({ error: "Store URL and access token are required" }, { status: 400 });
  }

  // Verify the token works by fetching shop info
  const shopRes = await fetch(`https://${storeUrl}/admin/api/2024-01/shop.json`, {
    headers: { "X-Shopify-Access-Token": accessToken },
  });

  if (!shopRes.ok) {
    return NextResponse.json(
      { error: "Invalid access token or store URL. Please check and try again." },
      { status: 400 }
    );
  }

  const shopData = await shopRes.json();
  const storeName = shopData.shop?.name ?? storeUrl;

  const store = await prisma.shopifyStore.upsert({
    where: { sellerId: session.user.id },
    update: { storeUrl, storeName, accessToken },
    create: { sellerId: session.user.id, storeUrl, storeName, accessToken },
    select: { id: true, storeName: true, storeUrl: true, createdAt: true },
  });

  return NextResponse.json({ store });
}
