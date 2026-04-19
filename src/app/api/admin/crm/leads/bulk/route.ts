import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function buildNotes(l: Record<string, string>): string | null {
  const parts: string[] = [];
  if (l["type"]?.trim())             parts.push(`Type: ${l["type"].trim()}`);
  if (l["experience"]?.trim())        parts.push(`Experience: ${l["experience"].trim()}`);
  if (l["what they want"]?.trim())    parts.push(`What they want: ${l["what they want"].trim()}`);
  if (l["when they start"]?.trim())   parts.push(`When they start: ${l["when they start"].trim()}`);
  if (l["date"]?.trim())              parts.push(`Lead date: ${l["date"].trim()}`);
  return parts.length ? parts.join(" | ") : null;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { leads } = await req.json();
  if (!Array.isArray(leads) || leads.length === 0) {
    return NextResponse.json({ error: "No leads provided" }, { status: 400 });
  }

  // Support both "number" (sheet format) and "phone" (template format)
  const valid = leads.filter(
    (l: Record<string, string>) =>
      l["name"]?.trim() && (l["number"]?.trim() || l["phone"]?.trim())
  );
  const skipped = leads.length - valid.length;

  if (valid.length === 0) {
    return NextResponse.json(
      { error: "No valid leads — NAME and NUMBER columns are required for every row" },
      { status: 400 }
    );
  }

  const result = await prisma.lead.createMany({
    data: valid.map((l: Record<string, string>) => ({
      name:       l["name"].trim(),
      phone:      (l["number"] || l["phone"]).trim(),
      email:      l["email"]?.trim() || null,
      city:       l["city"]?.trim() || null,
      investment: l["investment"]?.trim() ? parseFloat(l["investment"]) : null,
      notes:      buildNotes(l),
      source:     "META_ADS",
      createdById: session.user.id,
    })),
  });

  return NextResponse.json({ created: result.count, skipped });
}
