import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encrypt";

const WEBHOOK_TOPICS = ["orders/paid", "orders/cancelled"];

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = await prisma.shopifyStore.findUnique({ where: { sellerId: session.user.id } });
  if (!store) return NextResponse.json({ error: "No Shopify store connected" }, { status: 400 });

  const accessToken = decrypt(store.accessToken);
  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://your-domain.com";

  const webhookUrl = `${baseUrl}/api/webhooks/shopify/orders`;

  const results: { topic: string; status: string }[] = [];

  for (const topic of WEBHOOK_TOPICS) {
    try {
      const res = await fetch(
        `https://${store.storeUrl}/admin/api/2025-01/webhooks.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken,
          },
          body: JSON.stringify({
            webhook: {
              topic,
              address: webhookUrl,
              format: "json",
            },
          }),
        }
      );

      if (res.ok) {
        results.push({ topic, status: "registered" });
      } else {
        const err = await res.json().catch(() => ({}));
        // 422 = already exists — that's fine
        const alreadyExists = res.status === 422;
        results.push({ topic, status: alreadyExists ? "already_exists" : "failed" });
      }
    } catch (err) {
      results.push({ topic, status: "error" });
    }
  }

  return NextResponse.json({ ok: true, results });
}
