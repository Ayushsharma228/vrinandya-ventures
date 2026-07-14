import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page        = Math.max(1, parseInt(searchParams.get("page")   ?? "1"));
  const limit       = Math.min(50,  parseInt(searchParams.get("limit")  ?? "20"));
  const marketplace = searchParams.get("marketplace") ?? "";

  const where = marketplace ? { marketplace } : {};

  const [reports, total] = await Promise.all([
    prisma.reconciliationReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
        _count:     { select: { entries: true } },
      },
    }),
    prisma.reconciliationReport.count({ where }),
  ]);

  return NextResponse.json({ reports, total, page, pages: Math.ceil(total / limit) });
}
