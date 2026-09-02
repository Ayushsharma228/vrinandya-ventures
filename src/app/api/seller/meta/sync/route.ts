import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const seller = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { metaAccessToken: true, metaAdAccountId: true },
  });

  if (!seller?.metaAccessToken || !seller?.metaAdAccountId) {
    return NextResponse.json({ error: "Meta account not connected" }, { status: 400 });
  }

  const synced = await syncSellerAdSpend(session.user.id, seller.metaAdAccountId, seller.metaAccessToken);
  return NextResponse.json({ success: true, synced });
}

export async function syncSellerAdSpend(sellerId: string, adAccountId: string, accessToken: string): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString().split("T")[0];
  const untilStr = new Date().toISOString().split("T")[0];

  // Pull campaign-level daily spend so we can attribute per campaign
  const url = `https://graph.facebook.com/v19.0/${adAccountId}/insights?fields=campaign_id,campaign_name,spend,clicks,impressions,date_start&level=campaign&time_increment=1&time_range={"since":"${sinceStr}","until":"${untilStr}"}&access_token=${accessToken}`;

  const res  = await fetch(url);
  const data = await res.json();

  if (!data.data || data.error) {
    throw new Error(data.error?.message ?? "Meta API error");
  }

  let synced = 0;
  for (const row of data.data as { campaign_id: string; campaign_name: string; spend: string; clicks: string; impressions: string; date_start: string }[]) {
    const amount      = parseFloat(row.spend);
    if (!amount) continue;

    const date         = new Date(row.date_start);
    const campaignId   = row.campaign_id;
    const campaignName = row.campaign_name;
    const clicks       = parseInt(row.clicks      ?? "0", 10);
    const impressions  = parseInt(row.impressions ?? "0", 10);

    const existing = await prisma.adSpend.findFirst({ where: { sellerId, date, campaignId } });
    if (existing) {
      await prisma.adSpend.update({
        where: { id: existing.id },
        data: { amount, campaignName, clicks, impressions, note: "Meta Ads (auto-synced)" },
      });
    } else {
      await prisma.adSpend.create({
        data: { sellerId, date, amount, campaignId, campaignName, clicks, impressions, note: "Meta Ads (auto-synced)" },
      });
    }
    synced++;
  }

  return synced;
}
