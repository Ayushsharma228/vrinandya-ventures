import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.DELHIVERY_API_TOKEN;
  if (!token) return NextResponse.json({ error: "Delhivery not configured" }, { status: 500 });

  const orders = await prisma.order.findMany({
    where: {
      sellerId: session.user.id,
      awbNumber: { not: null },
      status: { notIn: ["DELIVERED", "CANCELLED", "RTO"] },
      ndrActionTaken: null,
    },
    select: { id: true, awbNumber: true, ndrAttempts: true },
  });

  if (orders.length === 0) return NextResponse.json({ found: 0, debug: "No active AWB orders" });

  const waybills = orders.map(o => o.awbNumber).join(",");

  // Use Delhivery's dedicated NDR API
  const res = await fetch(
    `https://track.delhivery.com/api/p/psc/ndr/wbns/?wbns=${waybills}&token=${token}`,
    { headers: { Authorization: `Token ${token}`, Accept: "application/json" } }
  );

  const rawText = await res.text();

  if (!res.ok) {
    return NextResponse.json({ error: `Delhivery NDR API error: ${rawText}`, status: res.status }, { status: 400 });
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(rawText);
  } catch {
    return NextResponse.json({ error: "Invalid JSON from Delhivery", raw: rawText }, { status: 400 });
  }

  // Delhivery NDR API returns { ndr: [...] } or similar — log raw for debugging
  console.log("[ndr/sync] Delhivery response:", JSON.stringify(data));

  // Handle both possible response shapes
  const ndrList: Array<Record<string, unknown>> =
    (data.ndr as Array<Record<string, unknown>>) ??
    (data.ShipmentData as Array<Record<string, unknown>>) ??
    [];

  let found = 0;

  for (const order of orders) {
    // Match by waybill in NDR list
    const ndrEntry = ndrList.find(n => {
      const wbn = String(n.waybill ?? n.Waybill ?? n.wbn ?? n.AWB ?? "");
      return wbn === order.awbNumber;
    });

    if (!ndrEntry) continue;

    const reason = String(ndrEntry.reason ?? ndrEntry.Reason ?? ndrEntry.remarks ?? ndrEntry.Instructions ?? "Delivery attempt failed");
    const status = String(ndrEntry.status ?? ndrEntry.Status ?? ndrEntry.reason_code ?? "NDR");

    await prisma.order.update({
      where: { id: order.id },
      data: {
        ndrStatus: status,
        ndrReason: reason,
        ndrAttempts: { increment: 1 },
      },
    });

    found++;
  }

  return NextResponse.json({ found, total: orders.length, raw: data });
}

// Debug endpoint — GET to see raw Delhivery response for a specific AWB
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.DELHIVERY_API_TOKEN;
  if (!token) return NextResponse.json({ error: "Delhivery not configured" }, { status: 500 });

  const awb = new URL(req.url).searchParams.get("awb");
  if (!awb) return NextResponse.json({ error: "awb param required" }, { status: 400 });

  // Fetch both general tracking AND NDR API for this AWB
  const [trackRes, ndrRes] = await Promise.all([
    fetch(`https://track.delhivery.com/api/v1/packages/json/?waybill=${awb}&token=${token}`,
      { headers: { Authorization: `Token ${token}`, Accept: "application/json" } }),
    fetch(`https://track.delhivery.com/api/p/psc/ndr/wbns/?wbns=${awb}&token=${token}`,
      { headers: { Authorization: `Token ${token}`, Accept: "application/json" } }),
  ]);

  const [trackData, ndrData] = await Promise.all([trackRes.text(), ndrRes.text()]);

  const safeParse = (text: string) => { try { return JSON.parse(text); } catch { return text; } };

  return NextResponse.json({
    tracking: { status: trackRes.status, body: safeParse(trackData) },
    ndr:      { status: ndrRes.status,   body: safeParse(ndrData) },
  });
}
