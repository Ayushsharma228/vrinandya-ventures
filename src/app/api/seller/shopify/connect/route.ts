import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encrypt";
import { ensureSellerActivation, updateActivation } from "@/lib/activation/engine";

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { storeUrl, accessToken } = await req.json();
  if (!storeUrl || !accessToken) {
    return NextResponse.json({ error: "Store URL and access token are required" }, { status: 400 });
  }

  // Verify the token works by fetching shop info
  const shopRes = await fetch(`https://${storeUrl}/admin/api/2025-01/shop.json`, {
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
    update: { storeUrl, storeName, accessToken: encrypt(accessToken) },
    create: { sellerId: session.user.id, storeUrl, storeName, accessToken: encrypt(accessToken) },
    select: { id: true, storeName: true, storeUrl: true, createdAt: true },
  });

  setImmediate(async () => {
    try {
      await ensureSellerActivation(session.user.id);
      await updateActivation(session.user.id);
    } catch {}
  });

  return NextResponse.json({ store });
}
