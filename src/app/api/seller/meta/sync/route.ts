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
  // Fetch last 30 days of daily spend
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString().split("T")[0];
  const untilStr = new Date().toISOString().split("T")[0];

  const url = `https://graph.facebook.com/v19.0/${adAccountId}/insights?fields=spend,date_start&time_increment=1&time_range={"since":"${sinceStr}","until":"${untilStr}"}&access_token=${accessToken}`;

  const res  = await fetch(url);
  const data = await res.json();

  if (!data.data || data.error) {
    throw new Error(data.error?.message ?? "Meta API error");
  }

  let synced = 0;
  for (const row of data.data as { spend: string; date_start: string }[]) {
    const amount = parseFloat(row.spend);
    if (!amount) continue;

    const date = new Date(row.date_start);

    // Upsert by seller + date
    await prisma.adSpend.upsert({
      where: { sellerId_date: { sellerId, date } },
      update: { amount, note: "Meta Ads (auto-synced)" },
      create: { sellerId, date, amount, note: "Meta Ads (auto-synced)" },
    });
    synced++;
  }

  return synced;
}
