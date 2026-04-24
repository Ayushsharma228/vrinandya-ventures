import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.DELHIVERY_API_TOKEN;
  if (!token) return NextResponse.json({ error: "DELHIVERY_API_TOKEN not set" }, { status: 500 });

  const res = await fetch("https://track.delhivery.com/api/backend/clientwarehouse/get/", {
    headers: { Authorization: `Token ${token}` },
  });

  const data = await res.json();
  return NextResponse.json(data);
}
