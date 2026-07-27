import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const DEFAULT_FORM_IDS = ["2038602106739692"];

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const record = await prisma.platformConfig.findUnique({ where: { key: "META_FORM_IDS" } });
  const ids: string[] = record?.value ? JSON.parse(record.value) : DEFAULT_FORM_IDS;
  return NextResponse.json({ formIds: ids, isDefault: !record?.value });
}

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { formIds } = await req.json() as { formIds?: string[] };
  if (!Array.isArray(formIds) || formIds.length === 0)
    return NextResponse.json({ error: "formIds must be a non-empty array" }, { status: 400 });

  const cleaned = formIds.map(id => id.trim()).filter(Boolean);
  if (cleaned.length === 0)
    return NextResponse.json({ error: "No valid form IDs provided" }, { status: 400 });

  await prisma.platformConfig.upsert({
    where:  { key: "META_FORM_IDS" },
    update: { value: JSON.stringify(cleaned), label: `Meta Lead Form IDs — updated ${new Date().toISOString()}` },
    create: { key: "META_FORM_IDS", value: JSON.stringify(cleaned), label: "Meta Lead Form IDs" },
  });

  return NextResponse.json({ formIds: cleaned });
}
