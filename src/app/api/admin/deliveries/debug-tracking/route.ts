import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const awb = new URL(req.url).searchParams.get("awb");
  if (!awb) return NextResponse.json({ error: "Pass ?awb=XXXX" }, { status: 400 });

  const token = process.env.DELHIVERY_API_TOKEN;
  if (!token) return NextResponse.json({ error: "No token" }, { status: 500 });

  const res = await fetch(
    `https://track.delhivery.com/api/v1/packages/json/?waybill=${awb}&token=${token}`,
    { headers: { Authorization: `Token ${token}`, Accept: "application/json" } }
  );

  const raw = await res.json();
  const shipment = raw.ShipmentData?.[0]?.Shipment ?? null;

  return NextResponse.json({
    raw_status_field:   shipment?.Status,
    status_status:      shipment?.Status?.Status,
    status_type:        shipment?.Status?.StatusType,
    returned_at:        shipment?.ReturnedAt,
    scans_latest:       shipment?.Scans?.[0],
    full_shipment_keys: shipment ? Object.keys(shipment) : null,
    full_raw:           raw,
  });
}
