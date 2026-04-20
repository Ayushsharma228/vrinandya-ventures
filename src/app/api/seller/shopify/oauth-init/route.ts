import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { storeUrl, clientId, clientSecret } = await req.json();
  if (!storeUrl || !clientId || !clientSecret) {
    return NextResponse.json({ error: "Store URL, Client ID, and Client Secret are required" }, { status: 400 });
  }

  const shopDomain = storeUrl.trim().replace("https://", "").replace(/\/$/, "");
  const domain = shopDomain.includes(".myshopify.com") ? shopDomain : `${shopDomain}.myshopify.com`;

  // Store credentials so callback can use them
  await prisma.shopifyStore.upsert({
    where: { sellerId: session.user.id },
    update: { storeUrl: domain, clientId, clientSecret, accessToken: "" },
    create: { sellerId: session.user.id, storeUrl: domain, storeName: domain, accessToken: "", clientId, clientSecret },
  });

  const scopes = "read_products,write_products,read_orders,write_orders,read_inventory,write_inventory";
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/shopify/callback`;
  const state = Buffer.from(JSON.stringify({ sellerId: session.user.id })).toString("base64");

  const authUrl = `https://${domain}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

  return NextResponse.json({ authUrl });
}
