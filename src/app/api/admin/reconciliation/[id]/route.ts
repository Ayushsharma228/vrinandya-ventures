import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit  = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));
  const status = searchParams.get("status") ?? "";

  const report = await prisma.reconciliationReport.findUnique({
    where: { id },
    include: { uploadedBy: { select: { id: true, name: true, email: true } } },
  });
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  const where = { reportId: id, ...(status ? { status: status as never } : {}) };

  const [entries, total] = await Promise.all([
    prisma.reconciliationEntry.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.reconciliationEntry.count({ where }),
  ]);

  return NextResponse.json({ report, entries, total, page, pages: Math.ceil(total / limit) });
}
