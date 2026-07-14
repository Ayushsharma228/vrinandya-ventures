import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const DEFAULTS: Record<string, { value: string; label: string; description: string; unit: string }> = {
  COMMISSION_RATE:      { value: "5",  label: "Commission Rate",         description: "Platform commission charged on every order (% of selling price)", unit: "%" },
  GST_ON_FEES_RATE:    { value: "18", label: "GST on Fees",             description: "GST applied on platform commission", unit: "%" },
  DEFAULT_SHIPPING_CHARGE: { value: "50", label: "Default Shipping Charge", description: "Shipping charge deducted when order has no explicit value", unit: "₹" },
  DEFAULT_PACKING_CHARGE:  { value: "20", label: "Default Packing Charge",  description: "Packing charge deducted when order has no explicit value", unit: "₹" },
  REMITTANCE_DAYS:     { value: "7",  label: "Remittance Days",         description: "Days after delivery before seller wallet credit is remitted", unit: "days" },
};

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.platformConfig.findMany();
  const map  = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  const configs = Object.entries(DEFAULTS).map(([key, meta]) => ({
    key,
    value:       map[key] ?? meta.value,
    label:       meta.label,
    description: meta.description,
    unit:        meta.unit,
    isDefault:   !(key in map),
  }));

  return NextResponse.json({ configs });
}

export async function PATCH(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key, value } = await req.json();
  if (!key || value === undefined || value === "")
    return NextResponse.json({ error: "key and value required" }, { status: 400 });
  if (!(key in DEFAULTS))
    return NextResponse.json({ error: "Unknown config key" }, { status: 400 });

  const num = parseFloat(value);
  if (isNaN(num) || num < 0)
    return NextResponse.json({ error: "Value must be a non-negative number" }, { status: 400 });

  await prisma.platformConfig.upsert({
    where:  { key },
    create: { key, value: String(num), label: DEFAULTS[key].label },
    update: { value: String(num) },
  });

  return NextResponse.json({ success: true, key, value: String(num) });
}
