import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const CONFIG_KEY = "META_CAMPAIGN_MAPPINGS";

// GET — returns saved campaign→seller mappings: { [campaignId]: sellerId }
export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const record = await prisma.platformConfig.findUnique({ where: { key: CONFIG_KEY } });
  const mappings: Record<string, string> = record ? JSON.parse(record.value) : {};
  return NextResponse.json({ mappings });
}

// POST — save mappings: body { mappings: { [campaignId]: sellerId } }
export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { mappings } = await req.json() as { mappings: Record<string, string> };
  if (!mappings || typeof mappings !== "object")
    return NextResponse.json({ error: "mappings required" }, { status: 400 });

  await prisma.platformConfig.upsert({
    where:  { key: CONFIG_KEY },
    update: { value: JSON.stringify(mappings) },
    create: { key: CONFIG_KEY, value: JSON.stringify(mappings), label: "Meta Campaign → Seller Mappings" },
  });

  return NextResponse.json({ ok: true });
}
