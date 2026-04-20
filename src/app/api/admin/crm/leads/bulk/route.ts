import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// Parses DD/MM/YYYY or DD/MM/YY → Date. Returns undefined if invalid.
function parseLeadDate(raw: string): Date | undefined {
  const s = raw?.trim();
  if (!s) return undefined;
  const parts = s.split("/");
  if (parts.length !== 3) return undefined;
  const [d, m, y] = parts.map(Number);
  const year = y < 100 ? 2000 + y : y;
  const date = new Date(year, m - 1, d);
  return isNaN(date.getTime()) ? undefined : date;
}

function buildNotes(l: Record<string, string>): string | null {
  const parts: string[] = [];
  if (l["type"]?.trim())            parts.push(`Type: ${l["type"].trim()}`);
  if (l["experience"]?.trim())       parts.push(`Experience: ${l["experience"].trim()}`);
  if (l["what they want"]?.trim())   parts.push(`What they want: ${l["what they want"].trim()}`);
  if (l["when they start"]?.trim())  parts.push(`When they start: ${l["when they start"].trim()}`);
  return parts.length ? parts.join(" | ") : null;
}

export async function POST(req: NextRequest)(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { leads } = await req.json();
  if (!Array.isArray(leads) || leads.length === 0) {
    return NextResponse.json({ error: "No leads provided" }, { status: 400 });
  }

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
    data: valid.map((l: Record<string, string>) => {
      const leadDate = parseLeadDate(l["date"]);
      return {
        name:        l["name"].trim(),
        phone:       (l["number"] || l["phone"]).trim(),
        email:       l["email"]?.trim() || null,
        city:        l["city"]?.trim() || null,
        investment:  l["investment"]?.trim() ? parseFloat(l["investment"]) : null,
        notes:       buildNotes(l),
        source:      "META_ADS",
        createdById: session.user.id,
        ...(leadDate ? { createdAt: leadDate } : {}),
      };
    }),
  });

  return NextResponse.json({ created: result.count, skipped });
}
